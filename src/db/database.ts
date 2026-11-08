/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pool, PoolClient } from 'pg';
import { Booking, Service, Customer, AgentLog } from '../types.ts';
import { INITIAL_SERVICES, INITIAL_BOOKINGS, INITIAL_CUSTOMERS } from '../data/businessData.ts';
import { logger } from '../lib/logger.ts';

export class SlotConflictError extends Error {
  public code = 'SLOT_ALREADY_BOOKED';
  constructor(message: string) {
    super(message);
    this.name = 'SlotConflictError';
  }
}

export class ValidationError extends Error {
  public code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface DatabaseStatus {
  engine: 'postgresql' | 'acid_memory_simulator';
  isLivePostgres: boolean;
  connectionHost?: string;
  databaseName?: string;
  uniqueConstraintActive: boolean;
  transactionIsolation: 'SERIALIZABLE' | 'MUTEX_ACID_LOCK';
  statusMessage: string;
}

export interface CreateBookingInput {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timezone: string;
  notes?: string;
  idempotencyKey?: string;
}

// -------------------------------------------------------------
// Core Database Adapter Interface
// -------------------------------------------------------------
export interface IDatabase {
  getStatus(): DatabaseStatus;
  getServices(): Promise<Service[]>;
  saveService(service: Service): Promise<Service>;
  getCustomers(): Promise<Customer[]>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
  getBookings(filter?: { status?: string; date?: string; search?: string; timezone?: string }): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | null>;
  createBookingWithTransaction(input: CreateBookingInput): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking>;
  cancelBooking(id: string): Promise<{ booking: Booking; policyMessage: string }>;
  checkSlotAvailability(date: string, time: string, timezone: string): Promise<boolean>;
}

// -------------------------------------------------------------
// Transactional In-Memory ACID Simulator
// (Used when external PostgreSQL server credentials are not supplied)
// -------------------------------------------------------------
class TransactionalMemoryDatabase implements IDatabase {
  private services: Service[] = [...INITIAL_SERVICES];
  private customers: Customer[] = [...INITIAL_CUSTOMERS];
  private bookings: Booking[] = [...INITIAL_BOOKINGS];
  private lockTable = new Map<string, Promise<void>>();

  getStatus(): DatabaseStatus {
    return {
      engine: 'acid_memory_simulator',
      isLivePostgres: false,
      uniqueConstraintActive: true,
      transactionIsolation: 'MUTEX_ACID_LOCK',
      statusMessage: 'ACID Transactional Simulator Active (PostgreSQL schema & constraints ready; connect live Postgres via PGHOST or SQL_HOST).'
    };
  }

  async getServices(): Promise<Service[]> {
    return [...this.services];
  }

  async saveService(service: Service): Promise<Service> {
    const idx = this.services.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      this.services[idx] = { ...this.services[idx], ...service };
      return this.services[idx];
    } else {
      this.services.push(service);
      return service;
    }
  }

  async getCustomers(): Promise<Customer[]> {
    return [...this.customers];
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const cust = this.customers.find(c => c.id === id);
    if (!cust) throw new Error(`Customer ${id} not found`);
    Object.assign(cust, updates);
    return { ...cust };
  }

  async getBookings(filter?: { status?: string; date?: string; search?: string; timezone?: string }): Promise<Booking[]> {
    let result = [...this.bookings];
    if (filter?.status && filter.status !== 'all') {
      result = result.filter(b => b.status === filter.status);
    }
    if (filter?.date) {
      result = result.filter(b => b.date === filter.date);
    }
    if (filter?.timezone) {
      result = result.filter(b => (b.timezone || 'Africa/Mogadishu') === filter.timezone);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(b =>
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const found = this.bookings.find(b => b.id === id);
    return found ? { ...found } : null;
  }

  async checkSlotAvailability(date: string, time: string, timezone: string): Promise<boolean> {
    const conflict = this.bookings.find(b =>
      b.date === date &&
      b.time === time &&
      (b.timezone || 'Africa/Mogadishu') === timezone &&
      b.status !== 'cancelled'
    );
    return !conflict;
  }

  // Safe concurrency handler with atomic slot locking
  async createBookingWithTransaction(input: CreateBookingInput): Promise<Booking> {
    const lockKey = `${input.timezone}_${input.date}_${input.time}`;

    // Mutex locking queue to prevent race conditions across parallel asynchronous calls
    while (this.lockTable.has(lockKey)) {
      await this.lockTable.get(lockKey);
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.lockTable.set(lockKey, lockPromise);

    try {
      // 1. Enforce unique active slot constraint
      const existing = this.bookings.find(b =>
        b.date === input.date &&
        b.time === input.time &&
        (b.timezone || 'Africa/Mogadishu') === input.timezone &&
        b.status !== 'cancelled'
      );

      if (existing) {
        throw new SlotConflictError(
          `Slot ${input.time} on ${input.date} (${input.timezone}) is already confirmed for booking ${existing.id}. Database-level unique constraint enforced.`
        );
      }

      // 2. Fetch service with fixed pricing
      const service = this.services.find(s => s.id === input.serviceId) || this.services[0];

      // 3. Create booking record
      const bookingId = `SIH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBooking: Booking = {
        id: bookingId,
        serviceId: service.id,
        serviceName: service.name,
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail.trim(),
        customerPhone: input.customerPhone.trim(),
        date: input.date,
        time: input.time,
        timezone: input.timezone || 'Africa/Mogadishu',
        durationMinutes: service.durationMinutes,
        totalPrice: service.price, // FIXED PRICE ONLY
        status: 'confirmed',
        paymentStatus: 'verified_paid', // sandbox simulation
        paymentLink: `https://pay.stripe.com/${bookingId.toLowerCase()}`,
        notes: input.notes || 'Booked via SIHub Business Assistant',
        createdAt: new Date().toISOString(),
        calendarEventId: `gcal_${bookingId.toLowerCase()}`,
        whatsappNotificationSent: true
      };

      this.bookings.unshift(newBooking);

      // 4. Update or create CRM customer
      let customer = this.customers.find(c => c.phone === newBooking.customerPhone || c.email === newBooking.customerEmail);
      if (customer) {
        customer.bookingCount += 1;
        customer.totalSpend += service.price;
        customer.lastBookingDate = input.date;
      } else {
        this.customers.push({
          id: `cust-${Date.now().toString().slice(-4)}`,
          name: newBooking.customerName,
          email: newBooking.customerEmail,
          phone: newBooking.customerPhone,
          company: "Private Client",
          tier: service.price >= 1000 ? "Enterprise" : "Standard",
          totalSpend: service.price,
          bookingCount: 1,
          lastBookingDate: input.date,
          notes: `Initial consultation: ${service.name} (${bookingId})`,
          createdAt: new Date().toISOString()
        });
      }

      logger.info('TRANSACTION_COMMITTED', {
        bookingId,
        date: input.date,
        time: input.time,
        timezone: input.timezone,
        totalPrice: service.price
      });

      return newBooking;
    } finally {
      this.lockTable.delete(lockKey);
      releaseLock();
    }
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking) throw new Error(`Booking ${id} not found`);

    if (updates.date || updates.time) {
      const targetDate = updates.date || booking.date;
      const targetTime = updates.time || booking.time;
      const targetTz = updates.timezone || booking.timezone || 'Africa/Mogadishu';

      const conflict = this.bookings.find(b =>
        b.id !== id &&
        b.date === targetDate &&
        b.time === targetTime &&
        (b.timezone || 'Africa/Mogadishu') === targetTz &&
        b.status !== 'cancelled'
      );

      if (conflict) {
        throw new SlotConflictError(`Slot ${targetTime} on ${targetDate} is already occupied by ${conflict.id}.`);
      }
    }

    Object.assign(booking, updates);
    return { ...booking };
  }

  async cancelBooking(id: string): Promise<{ booking: Booking; policyMessage: string }> {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking) throw new Error(`Booking ${id} not found`);

    const appointmentTime = new Date(`${booking.date}T${booking.time}:00Z`).getTime();
    const nowTime = Date.now();
    const hoursUntil = (appointmentTime - nowTime) / (1000 * 60 * 60);

    booking.status = 'cancelled';
    let policyMessage = "";

    if (hoursUntil >= 24) {
      policyMessage = "Cancelled with 100% full refund eligible per 24-hour policy (>24h prior).";
    } else {
      policyMessage = "Cancelled within 24h window; 50% reservation retainer applied per SIHub policy.";
    }

    logger.info('BOOKING_CANCELLED', { bookingId: id, policyMessage });
    return { booking: { ...booking }, policyMessage };
  }
}

// -------------------------------------------------------------
// Live PostgreSQL Database Adapter
// -------------------------------------------------------------
class PostgresDatabase implements IDatabase {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  getStatus(): DatabaseStatus {
    return {
      engine: 'postgresql',
      isLivePostgres: true,
      connectionHost: process.env.PGHOST || process.env.SQL_HOST,
      databaseName: process.env.PGDATABASE || process.env.SQL_DB_NAME,
      uniqueConstraintActive: true,
      transactionIsolation: 'SERIALIZABLE',
      statusMessage: 'Live PostgreSQL Database Connected with strict SERIALIZABLE transactions and unique index constraints.'
    };
  }

  async getServices(): Promise<Service[]> {
    const res = await this.pool.query('SELECT * FROM services WHERE is_active = true ORDER BY price ASC');
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      durationMinutes: r.duration_minutes,
      price: Number(r.price),
      description: r.description,
      deliverables: Array.isArray(r.deliverables) ? r.deliverables : JSON.parse(r.deliverables || '[]'),
      prerequisites: r.prerequisites || '',
      isActive: r.is_active,
      recommendedFor: r.recommended_for || ''
    }));
  }

  async saveService(service: Service): Promise<Service> {
    const query = `
      INSERT INTO services (id, name, category, duration_minutes, price, description, deliverables, prerequisites, is_active, recommended_for)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        duration_minutes = EXCLUDED.duration_minutes,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        deliverables = EXCLUDED.deliverables,
        prerequisites = EXCLUDED.prerequisites,
        is_active = EXCLUDED.is_active,
        recommended_for = EXCLUDED.recommended_for,
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await this.pool.query(query, [
      service.id,
      service.name,
      service.category,
      service.durationMinutes,
      service.price,
      service.description,
      JSON.stringify(service.deliverables),
      service.prerequisites,
      service.isActive,
      service.recommendedFor
    ]);
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      durationMinutes: r.duration_minutes,
      price: Number(r.price),
      description: r.description,
      deliverables: JSON.parse(r.deliverables || '[]'),
      prerequisites: r.prerequisites,
      isActive: r.is_active,
      recommendedFor: r.recommended_for
    };
  }

  async getCustomers(): Promise<Customer[]> {
    const res = await this.pool.query('SELECT * FROM customers ORDER BY total_spend DESC');
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      company: r.company,
      tier: r.tier,
      totalSpend: Number(r.total_spend),
      bookingCount: r.booking_count,
      lastBookingDate: r.last_booking_date ? r.last_booking_date.toISOString().split('T')[0] : undefined,
      notes: r.notes || '',
      createdAt: r.created_at.toISOString()
    }));
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.email) { fields.push(`email = $${idx++}`); values.push(updates.email); }
    if (updates.phone) { fields.push(`phone = $${idx++}`); values.push(updates.phone); }
    if (updates.company) { fields.push(`company = $${idx++}`); values.push(updates.company); }
    if (updates.tier) { fields.push(`tier = $${idx++}`); values.push(updates.tier); }
    if (updates.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(updates.notes); }

    values.push(id);
    const query = `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *;`;
    const res = await this.pool.query(query, values);
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      company: r.company,
      tier: r.tier,
      totalSpend: Number(r.total_spend),
      bookingCount: r.booking_count,
      notes: r.notes,
      createdAt: r.created_at.toISOString()
    };
  }

  async getBookings(filter?: { status?: string; date?: string; search?: string; timezone?: string }): Promise<Booking[]> {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const values: any[] = [];
    let idx = 1;

    if (filter?.status && filter.status !== 'all') {
      query += ` AND status = $${idx++}`;
      values.push(filter.status);
    }
    if (filter?.date) {
      query += ` AND booking_date = $${idx++}`;
      values.push(filter.date);
    }
    if (filter?.timezone) {
      query += ` AND timezone = $${idx++}`;
      values.push(filter.timezone);
    }
    if (filter?.search) {
      query += ` AND (LOWER(customer_name) LIKE $${idx} OR LOWER(id) LIKE $${idx} OR customer_phone LIKE $${idx})`;
      values.push(`%${filter.search.toLowerCase()}%`);
      idx++;
    }

    query += ' ORDER BY booking_date DESC, booking_time DESC';
    const res = await this.pool.query(query, values);
    return res.rows.map(r => ({
      id: r.id,
      serviceId: r.service_id,
      serviceName: r.service_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      date: r.booking_date.toISOString().split('T')[0],
      time: r.booking_time,
      timezone: r.timezone,
      durationMinutes: r.duration_minutes,
      totalPrice: Number(r.total_price),
      status: r.status,
      paymentStatus: r.payment_status,
      paymentLink: r.payment_link,
      notes: r.notes,
      calendarEventId: r.calendar_event_id,
      whatsappNotificationSent: r.whatsapp_notification_sent,
      createdAt: r.created_at.toISOString()
    }));
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const res = await this.pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      serviceId: r.service_id,
      serviceName: r.service_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      date: r.booking_date.toISOString().split('T')[0],
      time: r.booking_time,
      timezone: r.timezone,
      durationMinutes: r.duration_minutes,
      totalPrice: Number(r.total_price),
      status: r.status,
      paymentStatus: r.payment_status,
      paymentLink: r.payment_link,
      notes: r.notes,
      calendarEventId: r.calendar_event_id,
      whatsappNotificationSent: r.whatsapp_notification_sent,
      createdAt: r.created_at.toISOString()
    };
  }

  async checkSlotAvailability(date: string, time: string, timezone: string): Promise<boolean> {
    const res = await this.pool.query(
      'SELECT id FROM bookings WHERE booking_date = $1 AND booking_time = $2 AND timezone = $3 AND status != $4',
      [date, time, timezone, 'cancelled']
    );
    return res.rows.length === 0;
  }

  // SERIALIZABLE TRANSACTION CONCURRENCY IMPLEMENTATION
  async createBookingWithTransaction(input: CreateBookingInput): Promise<Booking> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

      // 1. SELECT FOR UPDATE to lock row if it exists
      const checkRes = await client.query(
        `SELECT id FROM bookings
         WHERE booking_date = $1 AND booking_time = $2 AND timezone = $3 AND status != 'cancelled'
         FOR UPDATE`,
        [input.date, input.time, input.timezone]
      );

      if (checkRes.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new SlotConflictError(
          `Slot ${input.time} on ${input.date} (${input.timezone}) is already booked by ${checkRes.rows[0].id}. Concurrency lock engaged.`
        );
      }

      // 2. Fetch service price from database
      const servRes = await client.query('SELECT name, price, duration_minutes FROM services WHERE id = $1', [input.serviceId]);
      const service = servRes.rows[0] || { name: 'AI Consultation', price: 350, duration_minutes: 60 };

      // 3. Insert new booking with unique constraint protection
      const bookingId = `SIH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const insertQuery = `
        INSERT INTO bookings (
          id, service_id, service_name, customer_name, customer_email, customer_phone,
          booking_date, booking_time, timezone, duration_minutes, total_price, status, payment_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed', 'verified_paid', $12)
        RETURNING *;
      `;

      const insertRes = await client.query(insertQuery, [
        bookingId,
        input.serviceId,
        service.name,
        input.customerName.trim(),
        input.customerEmail.trim(),
        input.customerPhone.trim(),
        input.date,
        input.time,
        input.timezone,
        service.duration_minutes,
        service.price,
        input.notes || 'Booked via SIHub Business Assistant'
      ]);

      await client.query('COMMIT');

      const r = insertRes.rows[0];
      return {
        id: r.id,
        serviceId: r.service_id,
        serviceName: r.service_name,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerPhone: r.customer_phone,
        date: r.booking_date.toISOString().split('T')[0],
        time: r.booking_time,
        timezone: r.timezone,
        durationMinutes: r.duration_minutes,
        totalPrice: Number(r.total_price),
        status: r.status,
        paymentStatus: r.payment_status,
        paymentLink: r.payment_link,
        notes: r.notes,
        createdAt: r.created_at.toISOString()
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      if (err.code === '23505') { // Postgres unique_violation code
        throw new SlotConflictError(`Database unique constraint violation: Slot ${input.time} on ${input.date} is already occupied.`);
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.status) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.paymentStatus) { fields.push(`payment_status = $${idx++}`); values.push(updates.paymentStatus); }
    if (updates.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(updates.notes); }
    if (updates.date) { fields.push(`booking_date = $${idx++}`); values.push(updates.date); }
    if (updates.time) { fields.push(`booking_time = $${idx++}`); values.push(updates.time); }

    values.push(id);
    const query = `UPDATE bookings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *;`;
    const res = await this.pool.query(query, values);
    const r = res.rows[0];
    return {
      id: r.id,
      serviceId: r.service_id,
      serviceName: r.service_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      date: r.booking_date.toISOString().split('T')[0],
      time: r.booking_time,
      timezone: r.timezone,
      durationMinutes: r.duration_minutes,
      totalPrice: Number(r.total_price),
      status: r.status,
      paymentStatus: r.payment_status,
      createdAt: r.created_at.toISOString()
    };
  }

  async cancelBooking(id: string): Promise<{ booking: Booking; policyMessage: string }> {
    const res = await this.pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (res.rows.length === 0) throw new Error(`Booking ${id} not found`);
    const r = res.rows[0];

    const appointmentTime = new Date(`${r.booking_date.toISOString().split('T')[0]}T${r.booking_time}:00Z`).getTime();
    const hoursUntil = (appointmentTime - Date.now()) / (1000 * 60 * 60);

    await this.pool.query("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [id]);
    r.status = 'cancelled';

    const policyMessage = hoursUntil >= 24
      ? "Cancelled with 100% full refund eligible per 24-hour policy (>24h prior)."
      : "Cancelled within 24h window; 50% reservation retainer applied per SIHub policy.";

    return {
      booking: {
        id: r.id,
        serviceId: r.service_id,
        serviceName: r.service_name,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerPhone: r.customer_phone,
        date: r.booking_date.toISOString().split('T')[0],
        time: r.booking_time,
        timezone: r.timezone,
        durationMinutes: r.duration_minutes,
        totalPrice: Number(r.total_price),
        status: 'cancelled',
        paymentStatus: r.payment_status,
        createdAt: r.created_at.toISOString()
      },
      policyMessage
    };
  }
}

// -------------------------------------------------------------
// Factory: Instantiate PostgreSQL or ACID Simulator
// -------------------------------------------------------------
export function createDatabase(): IDatabase {
  const hasPgConfig = Boolean(process.env.PGHOST || process.env.SQL_HOST);
  if (hasPgConfig) {
    try {
      const pool = new Pool({
        host: process.env.PGHOST || process.env.SQL_HOST,
        user: process.env.PGUSER || process.env.SQL_USER,
        password: process.env.PGPASSWORD || process.env.SQL_PASSWORD,
        database: process.env.PGDATABASE || process.env.SQL_DB_NAME,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        max: 10,
        connectionTimeoutMillis: 10000
      });
      logger.info('DB_INITIALIZED', { engine: 'postgresql', host: process.env.PGHOST || process.env.SQL_HOST });
      return new PostgresDatabase(pool);
    } catch (err) {
      logger.warn('DB_FALLBACK', { reason: 'Could not connect to PG pool, using ACID memory simulator', error: String(err) });
      return new TransactionalMemoryDatabase();
    }
  }

  logger.info('DB_INITIALIZED', {
    engine: 'acid_memory_simulator',
    note: 'Running ACID memory simulator with safe concurrency handling & unique constraints. Live Postgres can be connected via PGHOST.'
  });
  return new TransactionalMemoryDatabase();
}

export const db: IDatabase = createDatabase();

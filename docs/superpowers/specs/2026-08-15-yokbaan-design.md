# YokBaan — Design Spec (v1)

วันที่: 2026-08-15
สถานะ: รออนุมัติก่อนเขียน implementation plan

---

## 1. โปรเจคนี้คืออะไร

YokBaan (ยกบ้าน) คือเว็บ e-commerce ร้านเจ้าเดียว สินค้าตั้งต้นคือของใช้ในบ้านของเจ้าของร้านเอง
ตั้งแต่คอมพิวเตอร์ โทรศัพท์ ทีวี ไปจนถึงเตียงนอน จาน ช้อน ส้อม

**เป้าหมายหลัก:** ฝึกทำระบบ e-commerce ให้เข้าใจว่า "ระบบพวกนี้ต้องมีอะไรบ้าง"
**เป้าหมายรอง:** ถ้าไปได้ดี ต่อยอดเป็นร้านขายจริงได้โดยไม่ต้องรื้อ

เจ้าของโปรเจคไม่เคยทำ e-commerce มาก่อน และกังวลเรื่องความปลอดภัยเป็นพิเศษ
design นี้จึงอธิบาย **เหตุผล** ของทุกการตัดสินใจ ไม่ใช่แค่บอกว่าให้ทำอะไร

### ทำไมชื่อ YokBaan

ตรวจแล้ว ณ 2026-08-15 ว่าไม่ชนกับใคร:

| ช่องทาง | ผล |
|---|---|
| `yokbaan.com` | ว่าง (whois: No match) |
| npm `yokbaan` | ว่าง (404) |
| GitHub | 0 repositories |
| แบรนด์บนเว็บ | ไม่พบ |

ชื่อที่พิจารณาแล้วตัดออก:
- **KhongManTongMee (ของมันต้องมี)** — โดเมนว่าง แต่เป็นวลีทั่วไปที่ร้านไทยใช้เกลื่อน SEO สู้ยาก
- **BaanMart** — ชน TikTok `@baanmart0`, IG `@baan_store`, `baanbaan.store`
- **SpoonToScreen** — สะอาดเกือบหมด แต่มี TikTok `@screen.to.spoon`
- **Rehome / LiquidateMe** — โดเมนถูกจดไปแล้ว

---

## 2. ขอบเขต v1 — Core Commerce

### ทำใน v1

- ระบบสมาชิก: สมัคร / เข้าสู่ระบบ / ออกจากระบบ
- แคตตาล็อกสินค้า: รายการสินค้า, หน้ารายละเอียด, หมวดหมู่, ค้นหา
- ตะกร้าสินค้า (guest ใส่ตะกร้าได้, ผูกกับบัญชีเมื่อ login)
- Checkout พร้อมจองสต็อก
- ชำระเงินผ่าน Stripe test mode
- หน้าประวัติออเดอร์ของลูกค้า
- หน้า admin: จัดการสินค้า, จัดการออเดอร์, อัปเดตสถานะจัดส่ง

### จงใจไม่ทำใน v1

ดูหัวข้อ 9 (Roadmap) — ทุกอย่างที่ไม่ได้อยู่ในรายการข้างบนคือ "ยังไม่ทำ" ไม่ใช่ "ลืม"

### สมมติฐานที่ตกลงกันแล้ว

1. **ร้านเจ้าเดียว** ไม่ใช่ marketplace ที่ให้คนอื่นมาเปิดร้าน
2. **ต้องสมัครสมาชิกก่อนสั่งซื้อ** — ดูสินค้าและใส่ตะกร้าได้โดยไม่ต้อง login แต่ตอน checkout ต้องมีบัญชี
   (เหตุผล: ประวัติออเดอร์และการดูแลลูกค้าง่ายกว่ามาก / guest checkout อยู่ใน Phase 2)
3. สกุลเงิน THB ภาษาไทย
4. สินค้าไม่มีตัวเลือกย่อย (ไม่มีสี/ไซซ์) ใน v1 — 1 สินค้า = 1 ราคา = 1 สต็อก

---

## 3. Stack และเหตุผล

| ชั้น | เลือก | เหตุผล |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind 4 + TypeScript | dev เร็วที่สุด ไม่มีแนวคิดใหม่ให้เรียน เส้นแบ่ง client/server ชัดเจน |
| Backend | NestJS 11 | มี validation / DI / โครงเทสครบ บังคับแยก controller-service ชัด และใช้อยู่แล้วใน duebook |
| ORM | Prisma 6 | type-safe, migration ดี, ป้องกัน SQL injection โดยปริยาย |
| Database | PostgreSQL 17 (Docker) | **ต้องการ ACID transaction + row lock สำหรับตัดสต็อก** — ดูหัวข้อ 5.3 |
| Payment | Stripe test mode + Mock provider | ฟรี ไม่ต้องมีนิติบุคคล ได้ฝึก webhook จริงครบทุกกรณี |
| Monorepo | npm workspaces | เหมือน duebook |

### ทำไมไม่ใช้ Next.js

Next.js เก่งเรื่องเป็น backend ให้ด้วย (Server Components, Server Actions, caching หลายชั้น)
แต่เรามี NestJS ทำหน้าที่นั้นอยู่แล้ว → ความสามารถหลักของ Next ซ้ำซ้อน
เท่ากับต้องเรียนแนวคิดหนักๆ ทั้งกอง แล้วใช้จริงแค่เศษเดียว

สิ่งเดียวที่เสียไปคือ SEO ซึ่ง **v1 ยังไม่มีลูกค้าจริง จึงยังไม่มีค่า** และมีทางแก้ชัดเจนใน Phase 3

### ทำไมไม่ใช้ Medusa หรือ Supabase

- **Medusa** ให้ระบบ e-commerce สำเร็จรูปมาเลย แต่ขัดกับเป้าหมาย "อยากรู้ว่าระบบพวกนี้ต้องมีอะไรบ้าง"
- **Supabase** ทำให้ logic สำคัญ (คำนวณราคา/ตัดสต็อก) ไปกองฝั่ง client ซึ่งตรงข้ามกับความกังวลเรื่องความปลอดภัย

---

## 4. โครงสร้างโปรเจค

```
yokbaan/
├─ apps/
│  ├─ api/                     NestJS — business logic ทั้งหมด
│  │  ├─ src/auth/             สมัคร/login/logout, guards
│  │  ├─ src/catalog/          สินค้า, หมวดหมู่, ค้นหา
│  │  ├─ src/cart/             ตะกร้า
│  │  ├─ src/checkout/         สร้างออเดอร์, จองสต็อก
│  │  ├─ src/payment/          PaymentProvider, webhook handler
│  │  ├─ src/orders/           ประวัติออเดอร์ลูกค้า
│  │  ├─ src/admin/            จัดการสินค้า/ออเดอร์
│  │  ├─ src/common/           guards, interceptors, filters
│  │  └─ prisma/               schema.prisma, migrations, seed.ts
│  └─ web/                     React + Vite
│     ├─ src/api/              ⬅ ชั้นเรียก API ชั้นเดียว
│     ├─ src/features/         แยกตามฟีเจอร์ ให้ตรงกับ module ของ API
│     ├─ src/routes/           map 1:1 กับ URL
│     └─ src/components/       UI ที่ใช้ร่วมกัน
├─ packages/shared/            types + zod schemas ใช้ร่วม 2 ฝั่ง
├─ docker-compose.yml          PostgreSQL 17
└─ docs/
```

### หลักการเดียวที่ต้องจำ

`apps/web` **ไม่เชื่อถืออะไรเลย** มันแค่แสดงผลและส่งความต้องการ
ราคา ยอดรวม สต็อก สิทธิ์ — คำนวณและตรวจสอบที่ `apps/api` ทั้งหมด
ถึงผู้ใช้จะเปิด DevTools แก้ตัวเลขในเบราว์เซอร์ ก็ไม่มีผล เพราะ API คำนวณใหม่จากฐานข้อมูลเสมอ

### กฎ 4 ข้อเพื่อให้ย้ายไป SSR ได้ง่ายวันหน้า

1. เรียก API ผ่าน `src/api/` ชั้นเดียว ไม่กระจาย `fetch` ตามคอมโพเนนต์
2. ห้ามแตะ `window` / `localStorage` ตอน render — ให้อยู่ใน effect เท่านั้น
3. แยกคอมโพเนนต์ที่แสดงผล ออกจากคอมโพเนนต์ที่ดึงข้อมูล
4. โครง route map ตรงกับ URL จริง 1:1

ทำตามนี้ คอมโพเนนต์ UI เกือบทั้งหมดย้ายได้โดยไม่ต้องแก้ เหลือแค่ชั้น routing กับ data loading

---

## 5. โครงข้อมูล

```
User ──< Order ──< OrderItem >── Product >── Category
 │                    │
 └──< Cart ──< CartItem >──┘        Product ──< ProductImage

Order ──< Payment              WebhookEvent (กันประมวลผลซ้ำ)
```

### ตาราง

| ตาราง | ฟิลด์สำคัญ |
|---|---|
| `User` | email (unique), passwordHash (argon2id), role: `CUSTOMER` \| `ADMIN`, name |
| `Category` | name, slug (unique) — ชั้นเดียว ไม่มีหมวดย่อย |
| `Product` | slug (unique), name, description, categoryId, `priceSatang` (Int), `stock` (Int), status: `DRAFT` \| `ACTIVE` \| `ARCHIVED` |
| `ProductImage` | productId, url, alt, sortOrder |
| `Cart` | userId (nullable), cartToken (สำหรับ guest) |
| `CartItem` | cartId, productId, quantity |
| `Order` | orderNumber, userId, status, `subtotalSatang`, `shippingSatang`, `totalSatang`, ที่อยู่จัดส่ง, `expiresAt` |
| `OrderItem` | orderId, productId, **productNameSnapshot**, **unitPriceSatangSnapshot**, quantity |
| `Payment` | orderId, provider, providerRef, status, amountSatang, rawPayload (Json) |
| `WebhookEvent` | provider, eventId (unique), processedAt |

### 5.1 เก็บเงินเป็นจำนวนเต็มหน่วยสตางค์

```
❌ price: 1250.50    → 0.1 + 0.2 = 0.30000000000000004
✅ priceSatang: 125050
```

เลขทศนิยมในคอมพิวเตอร์ปัดเศษเพี้ยน พอบวกหลายรายการยอดรวมไม่ตรง
ระบบการเงินทุกที่ในโลกใช้จำนวนเต็มหน่วยย่อยที่สุด แสดงผลค่อยหาร 100 ตอนวาดหน้าจอ

### 5.2 OrderItem เก็บสำเนาชื่อและราคา

ถ้า OrderItem ชี้ไปที่ Product เฉยๆ พอลดราคาทีวีจาก 8,000 เป็น 6,000
ออเดอร์เมื่อวานที่ลูกค้าจ่าย 8,000 จะแสดงเป็น 6,000 ทันที → ใบเสร็จผิด บัญชีผิด

**ออเดอร์คือบันทึกที่แช่แข็งไว้ ณ เวลาที่ซื้อ** ไม่ใช่ view ของข้อมูลปัจจุบัน

### 5.3 จองสต็อกตอนสั่งซื้อ ปล่อยคืนถ้าไม่จ่ายใน 30 นาที

ปัญหา: ตัดสต็อกตอนไหน

| | ตัดตอนจ่ายเงินสำเร็จ | **จองตอนสั่งซื้อ (เลือกอันนี้)** |
|---|---|---|
| ปัญหาที่เกิด | 2 คนจ่ายพร้อมกันของชิ้นสุดท้าย → รับเงินทั้งคู่ แต่ของมีชิ้นเดียว | คนกดสั่งแล้วหายไป ของถูกล็อกเปล่าๆ |
| ความยากในการแก้ | ต้อง refund + ขอโทษลูกค้า | cron ปล่อยคืนหลัง 30 นาที |

เหตุผลที่เลือก: **"ล็อกของไว้ชั่วคราว" แก้ง่ายกว่า "รับเงินแล้วไม่มีของส่ง" มาก**

การจองทำใน transaction ที่ล็อกแถวสินค้า (`SELECT ... FOR UPDATE`)
คนที่กดพร้อมกันต้องต่อคิว → สต็อกไม่มีทางติดลบ
ใช้ `@nestjs/schedule` รัน cron ปล่อยคืนออเดอร์ที่หมดอายุ

---

## 6. Flow การชำระเงิน

### สถานะออเดอร์

```
PENDING_PAYMENT ──จ่ายสำเร็จ──> PAID ──> SHIPPED ──> COMPLETED
       │
       ├──ไม่จ่ายใน 30 นาที──> EXPIRED    (คืนสต็อก)
       └──ลูกค้ายกเลิก──────> CANCELLED  (คืนสต็อก)

PAID ──webhook มาช้าหลัง EXPIRED และสต็อกไม่พอ──> NEEDS_REFUND
```

### ลำดับเหตุการณ์

1. ลูกค้ากดสั่งซื้อ → API คำนวณราคาใหม่จากฐานข้อมูล → ล็อกแถวสินค้า → จองสต็อก →
   สร้าง Order `PENDING_PAYMENT` + OrderItem พร้อม snapshot + ตั้ง `expiresAt`
   **ทั้งหมดอยู่ใน transaction เดียว — พังกลางทางย้อนกลับหมด**
2. API เรียก `PaymentProvider.createSession(order)` → ได้ redirect URL
3. ลูกค้าไปกรอกบัตรที่หน้าของ Stripe — เลขบัตรไม่เคยผ่านเซิร์ฟเวอร์เรา
4. Stripe ยิง webhook → ตรวจลายเซ็น → เช็ค `WebhookEvent` ว่าเคยประมวลผลหรือยัง →
   อัปเดต Payment + Order เป็น `PAID` → ล้างตะกร้า
5. ลูกค้าเด้งกลับหน้าออเดอร์ ซึ่งอ่านสถานะจากฐานข้อมูลเท่านั้น

### 3 กับดักที่ออกแบบดักไว้แล้ว

| กับดัก | ถ้าไม่กัน | ทางกัน |
|---|---|---|
| เชื่อ URL ขากลับ | ลูกค้าพิมพ์ `/success` เองก็ได้ของฟรี | สถานะเปลี่ยนได้จาก webhook ที่ตรวจลายเซ็นแล้วเท่านั้น |
| webhook ยิงซ้ำ | Stripe ยิงซ้ำเมื่อไม่ได้ HTTP 200 → ตัดสต็อก 2 รอบ | `WebhookEvent` เก็บ eventId — เจอซ้ำตอบ 200 แล้วจบ |
| webhook มาช้ากว่า 30 นาที | ออเดอร์ EXPIRED คืนสต็อกแล้ว แต่เงินเข้า | พยายามจองสต็อกใหม่ ถ้าไม่พอ → `NEEDS_REFUND` ให้ admin เห็น ไม่เงียบหาย |

### PaymentProvider interface

```ts
interface PaymentProvider {
  createSession(order: Order): Promise<{ providerRef: string; redirectUrl: string }>;
  verifyWebhook(rawBody: Buffer, signature: string): PaymentEvent;
}
```

- `StripeProvider` — ใช้จริง (test mode)
- `MockProvider` — ใช้ตอนรัน automated test ไม่ต้องต่อเน็ต
- วันหน้าเพิ่ม `OmiseProvider` ได้โดยโค้ดออเดอร์ไม่ต้องแก้

**หมายเหตุทางเทคนิค:** route ของ webhook ต้องปิด body parser ของ NestJS
เพราะการตรวจลายเซ็นต้องใช้ raw body — เป็นจุดที่พลาดกันบ่อย

---

## 7. Security

### บัญชีผู้ใช้

- รหัสผ่านเข้ารหัสด้วย **argon2id** — ฐานข้อมูลหลุดก็ยังปลอดภัย
- Session ใน cookie **httpOnly + Secure + SameSite=Lax** — JavaScript อ่านไม่ได้ กัน XSS ขโมย token
- error ตอน login เหมือนกันเสมอ ("อีเมลหรือรหัสผ่านไม่ถูกต้อง") ไม่บอกว่าอีเมลมีในระบบไหม
- `@nestjs/throttler` จำกัดจำนวนครั้ง login / สมัคร / checkout

### สิทธิ์ — จุดที่พลาดกันมากที่สุดในระบบจริง

- ทุก endpoint ของ admin ผ่าน guard เช็ค `role === ADMIN`
- **ทุก query ที่ดึงข้อมูลส่วนตัวต้องกรองด้วย userId ของคนที่ล็อกอินเสมอ**
  ไม่ใช่ `findUnique({ id })` เฉยๆ เพราะลูกค้า A เปลี่ยนเลขใน URL เป็นออเดอร์ลูกค้า B ได้
  ช่องโหว่นี้ชื่อ **IDOR (Insecure Direct Object Reference)** — เป็นบั๊กที่เจอบ่อยที่สุดใน API จริง

### ข้อมูลเข้า

- DTO + `class-validator` เปิด `whitelist: true` และ `forbidNonWhitelisted: true`
  ฟิลด์ที่ไม่ได้ประกาศถูกทิ้ง → กันคนแอบส่ง `{"role":"ADMIN"}` ตอนสมัครสมาชิก
- **ไม่รับราคา/ยอดรวมจาก client เด็ดขาด** รับแค่ `productId` กับ `quantity`
- Prisma parameterize ให้อยู่แล้ว — ห้ามใช้ `$queryRawUnsafe`

### ไฟล์อัปโหลด (รูปสินค้า)

- ตรวจชนิดไฟล์จริงและขนาด
- ตั้งชื่อไฟล์ใหม่แบบสุ่ม ไม่ใช้ชื่อเดิมจากผู้ใช้

### ระบบ

- `helmet` ใส่ security headers
- CORS อนุญาตเฉพาะ origin ของเว็บเรา (`credentials: true`)
- `.env` ไม่เข้า git, commit `.env.example` ไว้ให้รู้ว่าต้องตั้งค่าอะไร
- exception filter ไม่ปล่อย stack trace ออกไปหา client

### สิ่งที่เราไม่ต้องรับผิดชอบเพราะออกแบบไว้ดี

**เลขบัตรเครดิตไม่เคยผ่านเซิร์ฟเวอร์เรา** — ลูกค้ากรอกที่หน้าของ Stripe เราได้แค่ token
ภาระ PCI-DSS จึงแทบเป็นศูนย์ นี่คือวิธีที่ร้านจริงส่วนใหญ่ทำ ไม่ใช่ทางลัด

---

## 8. การเทส

รันด้วย Jest + supertest ต่อ PostgreSQL จริงใน Docker (ไม่ใช้ mock database)

### 4 เทสที่พิสูจน์ว่าระบบใช้ได้จริง

1. **ซื้อครบ flow** ด้วย MockProvider → ออเดอร์เป็น `PAID`, สต็อกลด 1
2. **webhook ซ้ำ** — ยิง event เดิม 2 ครั้ง → สต็อกต้องลดครั้งเดียว
3. **แย่งของชิ้นสุดท้าย** — ยิง 2 request พร้อมกัน → สำเร็จคนเดียว สต็อกไม่ติดลบ
4. **ออเดอร์หมดอายุ** — cron ทำงาน → สต็อกคืนกลับมา

ถ้า 4 ตัวนี้ผ่าน แปลว่าส่วนที่ยากที่สุดของ e-commerce ทำถูกแล้ว

### เทสอื่น

- Unit test: การคำนวณราคา, การเปลี่ยนสถานะออเดอร์, guard ตรวจสิทธิ์
- Frontend: Vitest + React Testing Library เฉพาะ logic ของตะกร้า
- E2E ด้วย Playwright — อยู่ใน Phase 3

---

## 9. Roadmap สู่ full

รายการนี้คือสิ่งที่ **จงใจไม่ทำใน v1** เพื่อให้ v1 จบได้ ไม่ใช่เพราะลืม

### Phase 2 — ร้านโตขึ้น

- รีวิวและเรตติ้งสินค้า
- โค้ดส่วนลด / โปรโมชัน
- Wishlist
- อีเมลแจ้งสถานะออเดอร์
- สั่งซื้อโดยไม่ต้องสมัครสมาชิก (guest checkout)
- ตัวเลือกสินค้า (สี / ไซซ์) — ต้องเพิ่มตาราง `ProductVariant`
- ค้นหาด้วย full-text search ของ PostgreSQL
- หมวดหมู่ย่อยหลายชั้น

### Phase 3 — ขายจริงในไทย

- **Omise / Opn Payments + PromptPay** (เพิ่ม `OmiseProvider` ไม่ต้องแก้โค้ดออเดอร์)
- ค่าส่งจริงตามน้ำหนัก/พื้นที่ + เลขพัสดุ + เชื่อมขนส่ง
- ใบเสร็จ / ใบกำกับภาษี
- สมุดที่อยู่ของลูกค้า
- **SEO** — ทำเป็นขั้น:
  1. middleware ใส่ `og:title` / `og:image` / `og:description` ให้บอท (แก้ปัญหาแชร์ลิงก์ในไลน์/เฟซไม่ขึ้นรูป — ครึ่งวัน)
  2. prerender หน้าสินค้าด้วย `vite-react-ssg` (1-2 วัน)
  3. SSR เต็มรูปแบบด้วย **React Router v7 framework mode** หรือ TanStack Start (3-5 วัน)
     — ไม่จำเป็นต้องไป Next.js เพราะสองตัวนี้ให้ SSR โดยยังเป็น React ธรรมดา
- CDN + image optimization
- Playwright E2E
- ระบบ log และแจ้งเตือน error (เช่น Sentry)
- แผนสำรองข้อมูลและกู้คืน

### Phase 4 — สเกล

- Multi-vendor (ให้คนอื่นมาเปิดร้าน) — เปลี่ยนโครงข้อมูลเยอะ
- รายงานยอดขาย / analytics
- หลายคลังสินค้า
- หลายภาษา
- แอปมือถือ (API พร้อมอยู่แล้วเพราะแยก backend ไว้ตั้งแต่ v1)

---

## 10. บันทึกการตัดสินใจ

| # | คำถาม | ผลสรุป | เหตุผล |
|---|---|---|---|
| 1 | ชื่อโปรเจค | YokBaan | ตรวจแล้วไม่ชนใครทั้ง domain / npm / GitHub / แบรนด์ |
| 2 | ทำไปเพื่ออะไร | ฝึกเป็นหลัก วางโครงให้ต่อยอดขายจริง | ใช้ pattern ระดับ production แต่ยังไม่รับเงินจริง |
| 3 | ขนาด v1 | Core Commerce | ให้จบได้จริง ส่วนที่เหลือจดไว้ใน Roadmap |
| 4 | Payment | Stripe test mode + Mock | ฟรี ไม่ต้องมีบริษัท ได้ฝึก webhook จริงครบ |
| 5 | Database | PostgreSQL | ต้องการ ACID + row lock สำหรับตัดสต็อก — ไม่ใช่แฟชั่นแต่เป็นความจำเป็น |
| 6 | Backend | NestJS + Prisma | มีโครงครบ ใช้อยู่แล้วใน duebook ไม่ต้องเรียนใหม่ |
| 7 | Frontend | React + Vite (ไม่ใช่ Next.js) | Next ซ้ำซ้อนกับ NestJS และหนักเกินจำเป็น / SEO ยังไม่มีค่าใน v1 และมีทางแก้ชัดเจน |
| 8 | รูปแบบร้าน | ร้านเจ้าเดียว | โจทย์คือขายของใช้ตัวเอง |
| 9 | ต้อง login ก่อนซื้อไหม | ต้อง (แต่ใส่ตะกร้าได้ก่อน) | ประวัติออเดอร์และการดูแลลูกค้าง่ายกว่า |
| 10 | ตัดสต็อกตอนไหน | จองตอนสั่งซื้อ + คืนใน 30 นาที | "ล็อกของชั่วคราว" แก้ง่ายกว่า "รับเงินแล้วไม่มีของส่ง" |

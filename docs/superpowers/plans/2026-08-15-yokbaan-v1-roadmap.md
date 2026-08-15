# YokBaan v1 — Roadmap ภาพรวม

> ไฟล์นี้คือ **สารบัญ** ไม่ใช่แผนลงมือ
> แผนละเอียดของแต่ละเฟสอยู่ในไฟล์แยก และจะถูกเขียนขึ้น **ก่อนเริ่มเฟสนั้น** ไม่ใช่เขียนล่วงหน้าทั้งหมด

**Spec:** [`../specs/2026-08-15-yokbaan-design.md`](../specs/2026-08-15-yokbaan-design.md)

## ทำไมถึงเขียนแผนทีละเฟส

1. แผนที่เขียนล่วงหน้า 2 เดือนจะล้าสมัยเมื่อไปถึงจริง — สิ่งที่เรียนรู้จากเฟส 2 จะเปลี่ยนวิธีทำเฟส 5
2. เจ้าของโปรเจคมี usage limit จำกัด การอ่านแผน 9 เฟสรวดเดียวกินโควตาโดยเปล่าประโยชน์

## กฎประจำทุก task

1. **TDD เสมอ** — เขียนเทสให้ fail ก่อน → เขียนโค้ดน้อยที่สุดให้ผ่าน → commit
2. **1 task = 1 commit** — ถ้า task ไหนต้อง commit 2 ครั้ง แปลว่ามันใหญ่ไป ต้องแยก
3. **task ต้องจบในตัว** — เปิด session ใหม่มาทำ task เดียวได้โดยไม่ต้องอ่านทั้งโปรเจค
4. **task สุดท้ายของทุกเฟสคือเอกสาร** — เฟสไม่ถือว่าเสร็จจนกว่า `docs/systems/<ระบบ>.md` จะเสร็จ

## เอกสารประจำระบบ — โครงที่ทุกไฟล์ต้องมี

ทุกไฟล์ใน `docs/systems/` ต้องมี 6 หัวข้อนี้:

```markdown
# <ชื่อระบบ>

## ระบบนี้ทำอะไร
อธิบายให้คนที่ไม่เคยเห็นโค้ดเข้าใจได้ใน 3 ประโยค

## ทำไมออกแบบแบบนี้
การตัดสินใจสำคัญ + ทางเลือกที่ไม่ได้เลือก + เหตุผล

## ไฟล์ที่เกี่ยวข้อง
ตารางไฟล์ → หน้าที่

## Flow การทำงาน
ลำดับเหตุการณ์ตั้งแต่ผู้ใช้กดจนจบ

## จุดที่พลาดง่าย
สิ่งที่ถ้าแก้โค้ดตรงนี้แล้วต้องระวัง

## วิธีทดสอบ
คำสั่งรันเทส + เทสไหนพิสูจน์อะไร
```

## นโยบายการใช้ Docker

**หลักการ: Docker ไว้รันของที่เราไม่ได้เขียน** — ฐานข้อมูล, ที่เก็บไฟล์, mail server
ส่วนโค้ดที่เราแก้ทุกนาที (API และเว็บ) รันตรงบนเครื่อง เพราะบน macOS การ sync ไฟล์
เข้าคอนเทนเนอร์ทำให้ hot reload หน่วงและดีบักยากขึ้นโดยไม่ได้อะไรกลับมา

| บริการ | ใช้ตอนไหน | ทำไม |
|---|---|---|
| PostgreSQL (2 ฐาน: `yokbaan` + `yokbaan_test`) | เฟส 1 | ฐานเทสแยก เทสจะได้ไม่ลบข้อมูลที่เราใช้ทดลอง |
| MinIO (จำลอง S3) | เฟส 8 — อัปโหลดรูปสินค้า | ย้ายขึ้น production เปลี่ยนแค่ config ไม่ต้องแก้โค้ด |
| Mailpit | Roadmap Phase 2 — อีเมลแจ้งสถานะ | ดักอีเมลไว้ดูในเบราว์เซอร์ ไม่ส่งออกไปจริง |
| Dockerfile ของ API | Roadmap Phase 3 — deploy จริง | |

---

## 9 เฟส

| เฟส | ระบบ | task | ได้อะไรเมื่อจบเฟส | เอกสาร |
|---|---|---|---|---|
| **1** | Foundation | 7 | monorepo รันได้ ต่อ DB ได้ มีหน้าเว็บเปล่าๆ | `README.md` |
| **2** | Auth | 9 | สมัคร/login/logout ได้ มี guard ตรวจสิทธิ์ | `auth.md` |
| **3** | Catalog | 6 | ดูรายการสินค้าและหน้ารายละเอียดได้ | `catalog.md` |
| **4** | Cart | 7 | ใส่ตะกร้า แก้จำนวน ลบได้ | `cart.md` |
| **5** | Checkout | 7 | สั่งซื้อได้ จองสต็อกถูกต้อง สต็อกไม่ติดลบ | `checkout.md` |
| **6** | Payment | 10 | จ่ายเงินผ่าน Stripe ได้ webhook ทนทาน | `payment.md` |
| **7** | Orders | 4 | ลูกค้าดูประวัติออเดอร์ตัวเองได้เท่านั้น | `orders.md` |
| **8** | Admin | 5 | จัดการสินค้า/ออเดอร์/อัปโหลดรูปได้ | `admin.md` |
| **9** | Hardening | 4 | security ครบ เทส 4 ตัวหลักผ่าน | `security.md` |

รวม **59 task**

---

## เฟส 1 — Foundation

**แผนละเอียด:** [`2026-08-15-phase-1-foundation.md`](2026-08-15-phase-1-foundation.md) ✅ พร้อมลงมือ

| # | Task | ได้อะไร |
|---|---|---|
| 1.1 | โครง monorepo + git | npm workspaces, tsconfig ฐาน, .gitignore |
| 1.2 | PostgreSQL ใน Docker | `docker compose up` แล้วต่อได้ |
| 1.3 | NestJS + health endpoint | `GET /health` ตอบ 200 พร้อมเทส |
| 1.4 | Prisma + migration แรก | ต่อ DB จาก NestJS ได้ |
| 1.5 | packages/shared | type ใช้ร่วม 2 ฝั่ง TypeScript ฟ้องเมื่อไม่ตรง |
| 1.6 | React + Vite + Tailwind | หน้าเว็บเรียก `/health` แล้วแสดงผลได้ |
| 1.7 | 📄 README + template เอกสารระบบ | โครงเอกสารที่ทุกเฟสหลังทำตาม |

---

## เฟส 2 — Auth

| # | Task | ได้อะไร |
|---|---|---|
| 2.1 | model `User` + migration | ตาราง user พร้อม role |
| 2.2 | `PasswordService` (argon2) | hash/verify พร้อม unit test |
| 2.3 | `POST /auth/register` | สมัครได้ + validation กัน mass assignment |
| 2.4 | `POST /auth/login` | ได้ httpOnly cookie |
| 2.5 | `AuthGuard` + `GET /auth/me` | endpoint ที่ต้อง login ถึงเข้าได้ |
| 2.6 | `RolesGuard` (ADMIN) | endpoint เฉพาะ admin |
| 2.7 | `POST /auth/logout` | ล้าง cookie |
| 2.8 | web: หน้า login/register + auth context | เว็บ login ได้จริง |
| 2.9 | 📄 `docs/systems/auth.md` | |

## เฟส 3 — Catalog

| # | Task |
|---|---|
| 3.1 | model `Category` `Product` `ProductImage` + migration + seed |
| 3.2 | `GET /products` — แบ่งหน้า + กรองตามหมวด |
| 3.3 | `GET /products/:slug` |
| 3.4 | ค้นหาด้วยชื่อสินค้า |
| 3.5 | web: หน้ารายการ + หน้ารายละเอียดสินค้า |
| 3.6 | 📄 `docs/systems/catalog.md` |

## เฟส 4 — Cart

| # | Task |
|---|---|
| 4.1 | model `Cart` `CartItem` + migration |
| 4.2 | cart token cookie สำหรับ guest |
| 4.3 | `POST /cart/items` — เพิ่มสินค้า (API คำนวณราคาเอง) |
| 4.4 | แก้จำนวน / ลบรายการ |
| 4.5 | รวมตะกร้า guest เข้าบัญชีตอน login |
| 4.6 | web: หน้าตะกร้า |
| 4.7 | 📄 `docs/systems/cart.md` |

## เฟส 5 — Checkout

| # | Task |
|---|---|
| 5.1 | model `Order` `OrderItem` + enum สถานะ + migration |
| 5.2 | `PricingService` — คำนวณยอดจาก DB (unit test) |
| 5.3 | `StockService.reserve()` — transaction + row lock |
| 5.4 | ⚠️ เทสแย่งของชิ้นสุดท้าย 2 request พร้อมกัน |
| 5.5 | `POST /checkout` — สร้างออเดอร์ + snapshot ราคา |
| 5.6 | cron ปล่อยสต็อกคืนเมื่อหมดอายุ + เทส |
| 5.7 | 📄 `docs/systems/checkout.md` |

## เฟส 6 — Payment

| # | Task |
|---|---|
| 6.1 | `PaymentProvider` interface + `MockProvider` |
| 6.2 | model `Payment` `WebhookEvent` + migration |
| 6.3 | `POST /payments/session` — สร้าง session |
| 6.4 | ปิด body parser เฉพาะ route webhook |
| 6.5 | `POST /payments/webhook` — ตรวจลายเซ็น |
| 6.6 | ⚠️ เทส webhook ยิงซ้ำ → สต็อกลดครั้งเดียว |
| 6.7 | webhook มาช้าหลังหมดอายุ → `NEEDS_REFUND` |
| 6.8 | `StripeProvider` ของจริง |
| 6.9 | web: flow จ่ายเงิน + หน้าสถานะออเดอร์ |
| 6.10 | 📄 `docs/systems/payment.md` |

## เฟส 7 — Orders

| # | Task |
|---|---|
| 7.1 | `GET /orders` — กรองด้วย userId ของคนที่ login |
| 7.2 | ⚠️ เทส IDOR — ลูกค้า A ขอออเดอร์ลูกค้า B ต้องได้ 404 |
| 7.3 | web: หน้าประวัติออเดอร์ |
| 7.4 | 📄 `docs/systems/orders.md` |

## เฟส 8 — Admin

| # | Task |
|---|---|
| 8.1 | admin จัดการสินค้า (สร้าง/แก้/เก็บเข้ากรุ) |
| 8.2 | อัปโหลดรูปสินค้า — ตรวจชนิดไฟล์ + ตั้งชื่อสุ่ม |
| 8.3 | admin ดูออเดอร์ + เปลี่ยนสถานะจัดส่ง |
| 8.4 | web: หน้า admin |
| 8.5 | 📄 `docs/systems/admin.md` |

## เฟส 9 — Hardening

| # | Task |
|---|---|
| 9.1 | helmet + CORS allowlist + throttler |
| 9.2 | exception filter — ไม่ปล่อย stack trace |
| 9.3 | รวมเทส 4 ตัวหลักเป็นชุดเดียว รันด้วยคำสั่งเดียว |
| 9.4 | 📄 `docs/systems/security.md` |

---

## เทส 4 ตัวที่พิสูจน์ว่าระบบใช้ได้จริง

| เทส | อยู่ใน task | พิสูจน์อะไร |
|---|---|---|
| ซื้อครบ flow | 6.6 | ระบบทำงานได้ทั้งเส้น |
| webhook ยิงซ้ำ → สต็อกลดครั้งเดียว | 6.6 | idempotency |
| 2 คนแย่งของชิ้นสุดท้าย | 5.4 | transaction + row lock |
| ออเดอร์หมดอายุ → สต็อกคืน | 5.6 | cron ทำงานถูก |
| ลูกค้า A ดูออเดอร์ลูกค้า B ไม่ได้ | 7.2 | กัน IDOR |

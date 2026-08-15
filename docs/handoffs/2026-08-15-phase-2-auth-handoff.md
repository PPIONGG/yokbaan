# Handoff — เริ่มเฟส 2 (Auth) ของ YokBaan

วันที่เขียน: 2026-08-15
เขียนเพื่อ: agent/session ถัดไป ที่จะมาทำเฟส 2 ต่อ
สถานะ: **เฟส 1 เสร็จและ push ขึ้น GitHub แล้ว พร้อมเริ่มเฟส 2**

---

## 1. อ่านอะไรก่อน (ตามลำดับ)

| ลำดับ | ไฟล์ | ทำไม |
|---|---|---|
| 1 | [`CONTEXT.md`](../../CONTEXT.md) | สถานะปัจจุบัน + กฎ 6 ข้อที่ห้ามลืม |
| 2 | [`docs/superpowers/specs/2026-08-15-yokbaan-design.md`](../superpowers/specs/2026-08-15-yokbaan-design.md) | design เต็ม — หัวข้อ 7 คือ security ซึ่งเป็นแกนของเฟส 2 |
| 3 | [`docs/superpowers/plans/2026-08-15-yokbaan-v1-roadmap.md`](../superpowers/plans/2026-08-15-yokbaan-v1-roadmap.md) | สารบัญ 9 เฟส — เฟส 2 มี 9 task |
| 4 | [`docs/superpowers/plans/2026-08-15-phase-1-foundation.md`](../superpowers/plans/2026-08-15-phase-1-foundation.md) | ตัวอย่างรูปแบบแผนที่เฟส 2 ต้องเขียนตาม |
| 5 | [`README.md`](../../README.md) | คำสั่งรันโปรเจค |

**ห้ามอ่านซ้ำ:** เนื้อหาที่อยู่ในไฟล์ข้างบนแล้ว เอกสารนี้จะไม่เขียนซ้ำ

---

## 2. เจ้าของโปรเจค — สิ่งที่ต้องรู้ก่อนคุย

- **ไม่เคยทำ e-commerce มาก่อน** กำลังเรียนรู้ เป้าหมายหลักคือฝึก เป้าหมายรองคือต่อยอดขายจริง
- **กังวลเรื่องความปลอดภัยเป็นพิเศษ** เคยพูดว่า "คิดว่าทำเองไม่ปลอดภัยในทุกๆ ด้าน" — เฟส 2 คือเฟสที่ตอบความกังวลนี้โดยตรง
- **ถามกลับเสมอว่า "ทำไมถึงแนะนำอันนี้"** ไม่รับคำแนะนำไปเฉยๆ และบอกตรงๆ เมื่อยังเลือกไม่ได้ ("งงๆ") → ต้องอธิบายกลไกเบื้องหลังพร้อมตัวอย่างรูปธรรมว่าถ้าเลือกผิดจะพังยังไง ไม่ใช่แค่ list ข้อดีข้อเสีย
- **ภาษาเอกสารและการสนทนาคือภาษาไทย** โค้ดและคำสั่งเป็นอังกฤษ
- **มี usage limit จำกัด** — เป็นเหตุผลที่แผนถูกซอยเป็น task ย่อยและเขียนทีละเฟส อย่าเขียนแผน 9 เฟสรวดเดียว
- **ต้องการเอกสารประจำทุกระบบ** — `docs/systems/<ระบบ>.md` เป็น task สุดท้ายบังคับของทุกเฟส ตาม template ใน [`docs/systems/README.md`](../systems/README.md)
- **ให้ติ๊ก checkbox ในไฟล์แผนทันทีที่ task ผ่านรีวิว** ไม่ใช่รอจบเฟส (เคยลืมมาแล้วและเจ้าตัวทัก)

---

## 3. เฟส 1 ทิ้งอะไรไว้ให้

Push แล้วที่ https://github.com/PPIONGG/yokbaan — 9 commits, `main`

โครงและไฟล์ทั้งหมดอยู่ใน README แล้ว **จุดที่เฟส 2 ต้องใช้ต่อโดยตรง:**

| ของ | ที่อยู่ | ใช้ทำอะไรในเฟส 2 |
|---|---|---|
| `AppModule` | `apps/api/src/app.module.ts` | เสียบ `AuthModule` ที่นี่ |
| `PrismaService` | `apps/api/src/prisma/prisma.service.ts` | `@Global()` แล้ว inject ได้เลยไม่ต้อง import ซ้ำ |
| `schema.prisma` | `apps/api/prisma/schema.prisma` | **ยังไม่มี model เลย** — `User` จะเป็น model แรก และเป็น migration แรกของโปรเจค |
| ฐานข้อมูลเทส | `yokbaan_test` (แยกจาก `yokbaan`) | กลไกสลับอยู่ที่ `apps/api/test/setup-env.ts` + `setupFiles` ใน `apps/api/test/jest-e2e.json` |
| สัญญากลาง | `packages/shared/src/` | เพิ่ม `authSchemas.ts` ที่นี่ ทั้ง api และ web import ตัวเดียวกัน |
| ชั้นเรียก API | `apps/web/src/api/client.ts` | มี `apiGet` แล้ว เฟส 2 ต้องเพิ่ม `apiPost` — `credentials: 'include'` ตั้งไว้รอ session cookie แล้ว |

**เทสที่มีตอนนี้ 4 ตัว** (api 2 + web 2) ทุกตัวผ่าน และผ่านการพิสูจน์ด้วย mutation test แล้วว่าจับ regression ได้จริง

---

## 4. การตัดสินใจที่ทำไปแทนเจ้าของโปรเจค

> ⚠️ **สำคัญ** — บันทึกฉบับเต็มอยู่ใน `.superpowers/sdd/2026-08-15-phase-1-foundation/progress.md`
> ซึ่ง **ถูก git ignore และอยู่แค่ในเครื่องเดิม** จึงคัดมาไว้ที่นี่เพื่อให้รอด

| # | ตัดสินอะไร | เหตุผล | ถ้าผิดจะเสียอะไร |
|---|---|---|---|
| 1 | เพิ่ม `zod` เป็น dependency ของ `apps/web` ตรงๆ | มี import จริงแต่ไม่ได้ประกาศ พึ่ง hoisting ของ npm | dependency เกินมา 1 ตัว |
| 2 | `vite.config.ts` import `defineConfig` จาก `vitest/config` | ตัวจาก `vite` ไม่รับ key `test` → type error | build พังทันที เห็นเลย |
| 3 | เพิ่ม `.superpowers/` ใน `.gitignore` | ไฟล์ scratch ของกระบวนการ ไม่ใช่ประวัติโปรเจค | ไม่มี |
| 4 | version major (NestJS 11 / Prisma 6 / React 19 / Vite 6 / Tailwind 4 / zod 3) ห้ามเปลี่ยน ถ้า peer conflict ให้ขยับเครื่องมือ dev แทน | major คือการเลือกเชิงสถาปัตยกรรม dev tool ไม่ใช่ | dev tool คลาดไป 1 minor |
| 5 | **ไม่ใส่ `moduleNameMapper` ใน jest config** | แผนเดิมเข้าใจผิดว่าต้องมี ความจริง npm workspaces symlink ให้แล้ว การใส่ = hardcode path ที่วันหน้าจะทำให้ api/web เห็นคนละไฟล์ ซึ่งคือปัญหาที่ `packages/shared` เกิดมาเพื่อแก้ | ถ้าเปลี่ยน test runner แล้วหาไฟล์ไม่เจอ จะฟ้องดังๆ ทันที เพิ่มทีหลังได้ |
| 6 | เพิ่ม `ln -s ../../.env apps/api/.env` เข้า README | symlink ถูก git ignore → clone ใหม่แล้ว `prisma migrate` หา `DATABASE_URL` ไม่เจอ | ไม่มี |
| 7 | Task 1.7 ให้เขียนตาราง `CONTEXT.md` ใหม่ทั้งตาราง แทนการจับคู่ข้อความตามแผน | ข้อความในแผนล้าสมัย | ตารางเพี้ยน แก้ง่าย |

reviewer อิสระตรวจข้อ 5 แล้วและ **เห็นด้วย**

---

## 5. งานที่ค้างอยู่ ณ ตอนหยุด

- **รีวิวรวมทั้งเฟส 1 ถูกส่งไปแล้วแต่ยังไม่ได้ผลกลับมา** — session เดิมหยุดก่อน ผลลัพธ์จึงไม่มีใครเห็น
  - หน้าที่ของมันคือหาปัญหาที่รีวิวรายตัวมองไม่เห็น โดยเฉพาะ **3 ข้อนี้ที่ควรตรวจก่อนเริ่มเฟส 2 หรืออย่างช้าก่อนเฟส 6:**
    1. bootstrap ของ NestJS ตอนนี้ทำให้ปิด body parser เฉพาะ route ของ Stripe webhook ได้ไหม (เฟส 6 ต้องตรวจลายเซ็นบน **raw body** ถ้าโครงตอนนี้ขวาง จะต้องรื้อ bootstrap ตอนนั้น)
    2. `schema.prisma` ที่ยังไม่มี model พร้อมสร้าง migration แรกไหม
    3. ค่าที่ต้องตรงกันแต่เขียนไว้ 2 ที่ มีหลุดไหม (7 task ทำโดย agent คนละตัวที่ไม่เห็นงานกัน)
  - **แนะนำ: รันรีวิวนี้ใหม่เป็นงานแรกของ session ถัดไป** ก่อนเขียนแผนเฟส 2 ถูกกว่าการไปเจอตอนเฟส 6 มาก
- ยังไม่มีแผนละเอียดของเฟส 2 — roadmap มีแค่รายการ 9 task

---

## 6. เริ่มเฟส 2 ยังไง

1. รันรีวิวรวมเฟส 1 ที่ค้างอยู่ (ข้อ 5) แล้วรายงานผลให้เจ้าของโปรเจค
2. เขียนแผนละเอียด `docs/superpowers/plans/<วันที่>-phase-2-auth.md` ตามรูปแบบของแผนเฟส 1 เป๊ะๆ — ทุก step มีโค้ดจริง คำสั่งจริง ผลลัพธ์ที่ควรเห็น ไม่มี "ทำตามความเหมาะสม"
3. ให้เจ้าของโปรเจคอนุมัติแผนก่อนแตะโค้ด
4. ลงมือแบบ subagent-driven — 1 task = 1 commit, TDD บังคับ (แดงก่อนเขียว เสมอ)
5. task สุดท้ายของเฟสคือ `docs/systems/auth.md`

### สิ่งที่เฟส 2 ต้องระวังเป็นพิเศษ

- **IDOR** — ทุก query ที่ดึงข้อมูลส่วนตัวต้องกรองด้วย userId ของคนที่ล็อกอิน ไม่ใช่ `findUnique({ id })` เฉยๆ (spec หัวข้อ 7) เขียนเทสพิสูจน์: ลูกค้า A ขอข้อมูลลูกค้า B ต้องได้ 404
- **mass assignment** — `whitelist: true` + `forbidNonWhitelisted: true` กันคนส่ง `{"role":"ADMIN"}` ตอนสมัคร เขียนเทสพิสูจน์
- **error ตอน login ต้องเหมือนกันเสมอ** ไม่บอกว่าอีเมลมีในระบบไหม
- **migration แรกของโปรเจค** — ตรวจว่ารันบน `yokbaan_test` ได้ด้วย ไม่ใช่แค่ `yokbaan`
- อย่าเผลอลบ `setupFiles` ออกจาก `apps/api/test/jest-e2e.json` ตอนแก้ไฟล์นั้น — เป็น regression ที่แย่ที่สุดที่เป็นไปได้ในโปรเจคนี้ (เทสจะไปลบข้อมูลจริงเงียบๆ)

---

## 7. คำสั่งที่ใช้บ่อย

ดู [`README.md`](../../README.md) — และอย่าลืม `ln -s ../../.env apps/api/.env` ถ้าเป็นเครื่องใหม่

พิสูจน์ว่าเทสยังใช้ฐานข้อมูลเทสอยู่ (ควรรันหลังแก้ jest config ทุกครั้ง):

```bash
# ต้องผ่าน — พิสูจน์ว่าเทสไม่แตะฐานที่ใช้เล่น
DATABASE_URL="postgresql://yokbaan:yokbaan@localhost:5434/does_not_exist?schema=public" npm run api:test

# ต้องพัง — พิสูจน์ว่าเทสใช้ฐานเทสจริง
DATABASE_URL_TEST="postgresql://yokbaan:yokbaan@localhost:5434/does_not_exist?schema=public" npm run api:test
```

---

## 8. Suggested skills

| สถานการณ์ | skill |
|---|---|
| เริ่ม session — ก่อนตอบอะไรทั้งสิ้น | `superpowers:using-superpowers` |
| ก่อนเขียนแผนเฟส 2 ถ้ามีอะไรต้องตัดสินใจใหม่ | `superpowers:brainstorming` |
| เขียนแผนละเอียดเฟส 2 | `superpowers:writing-plans` |
| ลงมือทำแผน | `superpowers:subagent-driven-development` |
| ตอนเขียนโค้ดแต่ละ task | `superpowers:test-driven-development` |
| รีวิวก่อนปิดเฟส | `superpowers:requesting-code-review` |
| ถ้าเจอบั๊กที่หาสาเหตุไม่เจอ | `superpowers:systematic-debugging` |
| ก่อนบอกว่า "เสร็จแล้ว" | `superpowers:verification-before-completion` |

**หมายเหตุ:** `subagent-driven-development` มีค่าเริ่มต้นว่าห้ามหยุดถามระหว่าง task — เจ้าของโปรเจคเคยขอให้หยุดตรวจทุก task แล้วเปลี่ยนใจเป็นให้ปล่อยยาว **ถามก่อนว่าจะเอาแบบไหน** คำสั่งของเจ้าของโปรเจคชนะค่าเริ่มต้นของ skill เสมอ

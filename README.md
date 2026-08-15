# YokBaan

เว็บ e-commerce ร้านเจ้าเดียว ขายของใช้ในบ้าน

Repo: https://github.com/PPIONGG/yokbaan

## เริ่มต้นใช้งาน

```bash
cp .env.example .env
ln -s ../../.env apps/api/.env   # Prisma CLI อ่าน .env จากโฟลเดอร์ workspace ของตัวเอง
npm install
npm run db:up      # เปิด PostgreSQL ใน Docker
npm run api:dev    # http://localhost:3000
npm run web:dev    # http://localhost:5173
```

> บรรทัด `ln -s` จำเป็นเพราะ symlink ถูก git ignore (มันชี้ไป `.env` ที่ไม่เข้า git)
> คนที่ clone repo ไปใหม่ต้องสร้างเอง มิฉะนั้น `prisma migrate` จะหา `DATABASE_URL` ไม่เจอ

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run db:up` / `db:down` | เปิด/ปิด PostgreSQL |
| `npm run api:dev` | รัน API แบบ watch |
| `npm run web:dev` | รันเว็บแบบ watch |
| `npm run api:test` | รันเทส API (ต้องเปิด db ก่อน) |
| `npm run web:test` | รันเทสเว็บ |

## เอกสาร

- [สถานะโปรเจค](CONTEXT.md) — เปิดอันนี้ก่อนเสมอ
- [Design spec](docs/superpowers/specs/2026-08-15-yokbaan-design.md)
- [Roadmap](docs/superpowers/plans/2026-08-15-yokbaan-v1-roadmap.md)
- [เอกสารประจำระบบ](docs/systems/)

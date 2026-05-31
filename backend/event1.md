# Kế hoạch triển khai: Hệ thống Quản lý Sự kiện

## Tổng quan nghiệp vụ

Hệ thống quản lý vòng đời sự kiện cho hai vai trò chính:
- **admin** (Đoàn trường): Tạo sự kiện không cần duyệt, có toàn quyền phê duyệt/từ chối/sửa/hủy/hoãn.
- **lienchi** (Liên chi đoàn): Tạo sự kiện phải qua duyệt, mọi thay đổi sau khi approved đều phải xin phép.
- **student** (Sinh viên): Chỉ đăng ký khi sự kiện ở trạng thái `approved`.

---

## 1. Trạng thái sự kiện (EventStatus Enum)

```typescript
enum EventStatus {
  DRAFT               = 'draft',               // Liên chi tạo nháp, chưa gửi duyệt
  PENDING             = 'pending',             // Đã gửi duyệt, chờ admin xem xét
  REVISION_REQUIRED   = 'revision_required',   // Admin yêu cầu sửa, kèm message
  APPROVED            = 'approved',            // Đã duyệt, mở đăng ký cho sinh viên
  UPDATE_REQUESTED    = 'update_requested',    // Liên chi xin sửa sự kiện đã approved
  CANCEL_REQUESTED    = 'cancel_requested',    // Liên chi xin hủy sự kiện đã approved
  POSTPONE_REQUESTED  = 'postpone_requested',  // Liên chi xin hoãn sự kiện đã approved
  CANCELLED           = 'cancelled',           // Đã hủy chính thức
  POSTPONED           = 'postponed',           // Đã hoãn, cần tạo sự kiện mới
  ONGOING             = 'ongoing',             // Đang diễn ra (cron job tự chuyển)
  ENDED               = 'ended',               // Đã kết thúc (cron job tự chuyển)
}
```

### Bảng chuyển trạng thái hợp lệ

| Từ trạng thái | Sang trạng thái | Ai thực hiện | Điều kiện |
|---|---|---|---|
| _(new)_ | `draft` | lienchi | Tạo mới |
| _(new)_ | `approved` | admin | Tạo mới, không cần duyệt |
| `draft` | `pending` | lienchi | Submit lần đầu |
| `revision_required` | `pending` | lienchi | Sửa xong, gửi lại |
| `pending` | `approved` | admin | Duyệt |
| `pending` | `cancelled` | admin | Từ chối + lý do |
| `pending` | `revision_required` | admin | Yêu cầu sửa + message |
| `approved` | `update_requested` | lienchi | Xin sửa + pendingChanges |
| `approved` | `cancel_requested` | lienchi | Xin hủy + lý do |
| `approved` | `postpone_requested` | lienchi | Xin hoãn + lý do + ngày mới |
| `update_requested` | `approved` | admin | Duyệt sửa → áp dụng pendingChanges |
| `update_requested` | `approved` | admin | Từ chối sửa → giữ nguyên data |
| `cancel_requested` | `cancelled` | admin | Duyệt hủy |
| `cancel_requested` | `approved` | admin | Từ chối hủy |
| `postpone_requested` | `postponed` | admin | Duyệt hoãn |
| `postpone_requested` | `approved` | admin | Từ chối hoãn |
| `approved` | `cancelled` | admin | Hủy trực tiếp (không cần xin phép) |
| `approved` | `postponed` | admin | Hoãn trực tiếp (không cần xin phép) |
| `approved` | `ongoing` | cron | `now >= startTime` |
| `ongoing` | `ended` | cron | `now >= endTime` |

---

## 2. Cập nhật Model

### Event model — bổ sung fields

```typescript
// Event.ts
interface IEvent {
  // ... fields hiện có ...

  status: EventStatus
  createdByRole: 'admin' | 'lienchi'
  createdBy: ObjectId           // userId

  // Lịch sử duyệt
  reviewHistory: IReviewEntry[]
  rejectionReason?: string      // Lý do từ chối (admin → lienchi)
  revisionMessage?: string      // Message yêu cầu sửa (admin → lienchi)

  // Yêu cầu thay đổi khi đã approved
  pendingChanges?: Partial<IEvent>       // Snapshot thay đổi chờ admin duyệt
  pendingChangeType?: 'update' | 'cancel' | 'postpone'
  pendingChangeReason?: string
  pendingProposedDate?: Date             // Dùng cho postpone

  // Thời gian
  startTime: Date
  endTime: Date
  registrationDeadline: Date

  // Đăng ký
  maxSlots?: number                      // undefined = không giới hạn
  currentSlots: number
}

interface IReviewEntry {
  action: 'approved' | 'rejected' | 'revision_requested' | 'update_approved' | 'update_rejected' | 'cancel_approved' | 'postpone_approved'
  by: ObjectId
  at: Date
  message?: string
}
```

### EventRegistration model

```typescript
interface IEventRegistration {
  eventId: ObjectId
  studentId: ObjectId
  registeredAt: Date
  status: 'active' | 'cancelled'
}
```

---

## 3. API Endpoints

### 3.1 CRUD cơ bản

| Method | Endpoint | Mô tả | Guard |
|---|---|---|---|
| `POST` | `/events` | Tạo sự kiện | Authenticated |
| `GET` | `/events` | Danh sách (filter role, status, date) | Authenticated |
| `GET` | `/events/:id` | Chi tiết kèm `pendingChanges` | Authenticated |
| `PUT` | `/events/:id` | Sửa nháp | `status IN [draft, revision_required]` + `isOwner` |
| `POST` | `/events/:id/submit` | Gửi duyệt | `status IN [draft, revision_required]` + `isOwner` |
| `DELETE` | `/events/:id` | Xóa hẳn | `role = admin` + `status = draft` |

### 3.2 Admin Review

| Method | Endpoint | Mô tả | Chuyển trạng thái |
|---|---|---|---|
| `PATCH` | `/events/:id/approve` | Duyệt | `pending → approved` |
| `PATCH` | `/events/:id/reject` | Từ chối + `{reason}` | `pending → cancelled` |
| `PATCH` | `/events/:id/request-revision` | Yêu cầu sửa + `{message}` | `pending → revision_required` |
| `PATCH` | `/events/:id/approve-update` | Duyệt yêu cầu sửa | `update_requested → approved` (áp pendingChanges) |
| `PATCH` | `/events/:id/approve-cancel` | Duyệt yêu cầu hủy | `cancel_requested → cancelled` |
| `PATCH` | `/events/:id/approve-postpone` | Duyệt yêu cầu hoãn | `postpone_requested → postponed` |
| `PATCH` | `/events/:id/reject-request` | Từ chối yêu cầu sửa/hủy/hoãn + `{reason}` | `*_requested → approved` |
| `PATCH` | `/events/:id/force-cancel` | Admin hủy trực tiếp | `approved → cancelled` (guard: isBeforeStart) |
| `PATCH` | `/events/:id/force-postpone` | Admin hoãn trực tiếp + `{proposedDate}` | `approved → postponed` (guard: isBeforeStart) |

### 3.3 Liên chi — Yêu cầu thay đổi (sau khi approved)

| Method | Endpoint | Body | Guard |
|---|---|---|---|
| `POST` | `/events/:id/request-update` | `{changes: Partial<Event>}` | `status = approved` + `isBeforeStart` + `noActiveRequest` |
| `POST` | `/events/:id/request-cancel` | `{reason: string}` | `status = approved` + `isBeforeStart` + `noActiveRequest` |
| `POST` | `/events/:id/request-postpone` | `{reason, proposedDate}` | `status = approved` + `isBeforeStart` + `noActiveRequest` |

### 3.4 Đăng ký sinh viên

| Method | Endpoint | Guard |
|---|---|---|
| `POST` | `/events/:id/register` | `status = approved` + `isRegistrationOpen` + `hasSlots` + chưa đăng ký |
| `DELETE` | `/events/:id/register` | `status = approved` + `isBeforeStart` |

---

## 4. Business Rule Guards

Tạo các guard function dùng ở service layer (không đặt trong controller):

```typescript
// guards/event.guards.ts

// Chỉ được thao tác khi chưa đến giờ diễn ra
const isBeforeStart = (event: IEvent): boolean =>
  new Date() < new Date(event.startTime)

// Sinh viên chỉ đăng ký khi sự kiện đã approved
const isApproved = (event: IEvent): boolean =>
  event.status === EventStatus.APPROVED

// Thời gian đăng ký còn hợp lệ
const isRegistrationOpen = (event: IEvent): boolean =>
  new Date() < new Date(event.registrationDeadline) &&
  new Date() < new Date(event.startTime)

// Còn slot trống (bỏ qua nếu không giới hạn)
const hasSlots = (event: IEvent): boolean =>
  event.maxSlots == null || event.currentSlots < event.maxSlots

// Không có request đang chờ duyệt
const noActiveRequest = (event: IEvent): boolean =>
  ![
    EventStatus.UPDATE_REQUESTED,
    EventStatus.CANCEL_REQUESTED,
    EventStatus.POSTPONE_REQUESTED,
  ].includes(event.status)

// Liên chi chỉ thao tác trên sự kiện của đơn vị mình
const isOwner = (event: IEvent, userId: string): boolean =>
  event.createdBy.toString() === userId
```

---

## 5. Controller Logic

### 5.1 createEvent

```typescript
// POST /events
async createEvent(dto: CreateEventDto, user: IUser) {
  if (user.role === 'admin') {
    // Tạo thẳng, status = approved, không cần duyệt
    return EventModel.create({ ...dto, status: 'approved', createdByRole: 'admin' })
  }
  // lienchi: tạo nháp
  return EventModel.create({ ...dto, status: 'draft', createdByRole: 'lienchi' })
}
```

### 5.2 updateEvent (chỉ cho nháp)

```typescript
// PUT /events/:id
async updateEvent(id: string, dto: UpdateEventDto, user: IUser) {
  const event = await EventModel.findById(id)
  if (!isOwner(event, user.id)) throw new ForbiddenException()
  if (![EventStatus.DRAFT, EventStatus.REVISION_REQUIRED].includes(event.status))
    throw new BadRequestException('Chỉ được sửa khi sự kiện đang ở trạng thái nháp hoặc yêu cầu sửa')
  return EventModel.findByIdAndUpdate(id, dto, { new: true })
}
```

### 5.3 requestUpdate (sửa khi đã approved)

```typescript
// POST /events/:id/request-update
async requestUpdate(id: string, changes: Partial<IEvent>, user: IUser) {
  const event = await EventModel.findById(id)
  if (!isOwner(event, user.id)) throw new ForbiddenException()
  if (!isApproved(event)) throw new BadRequestException('Sự kiện chưa được duyệt')
  if (!isBeforeStart(event)) throw new BadRequestException('Sự kiện đã bắt đầu')
  if (!noActiveRequest(event)) throw new BadRequestException('Đang có yêu cầu chờ duyệt')

  return EventModel.findByIdAndUpdate(id, {
    status: EventStatus.UPDATE_REQUESTED,
    pendingChanges: changes,
    pendingChangeType: 'update',
  }, { new: true })
}
```

### 5.4 approveUpdate

```typescript
// PATCH /events/:id/approve-update
async approveUpdate(id: string, adminId: string) {
  const event = await EventModel.findById(id)
  if (event.status !== EventStatus.UPDATE_REQUESTED)
    throw new BadRequestException('Không có yêu cầu sửa nào đang chờ')

  const updated = await EventModel.findByIdAndUpdate(id, {
    ...event.pendingChanges,         // Áp dụng thay đổi
    status: EventStatus.APPROVED,
    pendingChanges: null,
    pendingChangeType: null,
    $push: { reviewHistory: { action: 'update_approved', by: adminId, at: new Date() } }
  }, { new: true })
  return updated
}
```

### 5.5 approveCancel — gửi notification

```typescript
// PATCH /events/:id/approve-cancel
async approveCancel(id: string, adminId: string) {
  const event = await EventModel.findById(id)
  if (event.status !== EventStatus.CANCEL_REQUESTED)
    throw new BadRequestException()

  await EventModel.findByIdAndUpdate(id, {
    status: EventStatus.CANCELLED,
    $push: { reviewHistory: { action: 'cancel_approved', by: adminId, at: new Date() } }
  })

  // Gửi thông báo đến tất cả sinh viên đã đăng ký
  const registrations = await EventRegistrationModel.find({ eventId: id, status: 'active' })
  await NotificationService.notifyMany(
    registrations.map(r => r.studentId),
    { type: 'event_cancelled', eventId: id, eventName: event.name }
  )
}
```

### 5.6 registerForEvent

```typescript
// POST /events/:id/register
async registerForEvent(id: string, studentId: string) {
  const event = await EventModel.findById(id)
  if (!isApproved(event)) throw new BadRequestException('Sự kiện chưa mở đăng ký')
  if (!isRegistrationOpen(event)) throw new BadRequestException('Đã hết hạn đăng ký')
  if (!hasSlots(event)) throw new BadRequestException('Sự kiện đã đủ người')

  const existing = await EventRegistrationModel.findOne({ eventId: id, studentId, status: 'active' })
  if (existing) throw new BadRequestException('Bạn đã đăng ký sự kiện này')

  await EventRegistrationModel.create({ eventId: id, studentId, registeredAt: new Date(), status: 'active' })
  await EventModel.findByIdAndUpdate(id, { $inc: { currentSlots: 1 } })
}
```

---

## 6. Cron Job tự động

```typescript
// cron/event-status.cron.ts  — chạy mỗi phút

// approved → ongoing
@Cron('* * * * *')
async markOngoing() {
  await EventModel.updateMany(
    { status: EventStatus.APPROVED, startTime: { $lte: new Date() } },
    { $set: { status: EventStatus.ONGOING } }
  )
}

// ongoing → ended
@Cron('* * * * *')
async markEnded() {
  await EventModel.updateMany(
    { status: EventStatus.ONGOING, endTime: { $lte: new Date() } },
    { $set: { status: EventStatus.ENDED } }
  )
}
```

---

## 7. Notification Events

| Trigger | Người nhận | Nội dung |
|---|---|---|
| Liên chi submit sự kiện | Admin | Sự kiện mới cần duyệt |
| Admin duyệt | Liên chi | Sự kiện đã được duyệt |
| Admin từ chối | Liên chi | Sự kiện bị từ chối + lý do |
| Admin yêu cầu sửa | Liên chi | Cần sửa + message hướng dẫn |
| Admin duyệt yêu cầu sửa/hủy/hoãn | Liên chi | Yêu cầu được chấp nhận |
| Admin từ chối yêu cầu | Liên chi | Yêu cầu bị từ chối + lý do |
| Sự kiện bị hủy (bất kỳ ai hủy) | Sinh viên đã đăng ký | Thông báo hủy |
| Sự kiện bị hoãn | Sinh viên đã đăng ký | Thông báo hoãn + ngày mới |

---

## 8. Test Plan

### Tạo sự kiện
- [ ] Admin tạo → `status = approved`, đăng ký mở ngay
- [ ] Liên chi tạo → `status = draft`, chưa cho đăng ký
- [ ] Liên chi submit draft → `status = pending`
- [ ] Liên chi sửa khi đang `pending` → bị chặn

### Luồng duyệt
- [ ] Admin duyệt → `approved`, sinh viên đăng ký được
- [ ] Admin từ chối + lý do → `cancelled`, lý do lưu vào `rejectionReason`
- [ ] Admin yêu cầu sửa + message → `revision_required`, message lưu vào `revisionMessage`
- [ ] Liên chi sửa sau `revision_required` → submit lại → `pending`, `reviewHistory` ghi log
- [ ] Vòng lặp duyệt nhiều lần → `reviewHistory` đầy đủ

### Thay đổi sau khi approved
- [ ] Liên chi xin sửa → `update_requested`, data gốc KHÔNG thay đổi
- [ ] Admin duyệt sửa → `pendingChanges` được áp dụng → `approved`
- [ ] Admin từ chối sửa → `approved`, `pendingChanges` bị xóa, data gốc giữ nguyên
- [ ] Liên chi gửi 2 request đồng thời → request thứ 2 bị chặn (`noActiveRequest`)
- [ ] Liên chi xin hủy sau giờ `startTime` → bị chặn (`isBeforeStart`)

### Đăng ký sinh viên
- [ ] Đăng ký sự kiện `pending` → bị chặn
- [ ] Đăng ký sự kiện `cancelled` → bị chặn
- [ ] Đăng ký sự kiện `approved` → thành công, `currentSlots` tăng 1
- [ ] Đăng ký trùng → bị chặn
- [ ] Đăng ký khi hết slot → bị chặn
- [ ] Đăng ký sau `registrationDeadline` → bị chặn

### Hủy / Hoãn
- [ ] Admin hủy trực tiếp trước `startTime` → `cancelled`, notification gửi đến registrants
- [ ] Admin hủy sau `startTime` → bị chặn
- [ ] Liên chi xin hủy → `cancel_requested` → admin duyệt → `cancelled` + notification
- [ ] Liên chi xin hoãn → `postpone_requested` → admin duyệt → `postponed` + notification
- [ ] Admin từ chối hủy → trở về `approved`

### Cron job
- [ ] Sự kiện đến `startTime` → tự chuyển `ongoing`, sinh viên không đăng ký thêm được
- [ ] Sự kiện đến `endTime` → tự chuyển `ended`

---

## 9. Tóm tắt files cần tạo / chỉnh sửa

| File | Loại | Mô tả |
|---|---|---|
| `models/Event.ts` | MODIFY | Thêm fields mới, cập nhật enum |
| `models/EventRegistration.ts` | CREATE | Model đăng ký sinh viên |
| `guards/event.guards.ts` | CREATE | Các hàm guard nghiệp vụ |
| `services/event.service.ts` | MODIFY | Toàn bộ logic nghiệp vụ mới |
| `controllers/event.controller.ts` | MODIFY | Thêm endpoints mới |
| `cron/event-status.cron.ts` | CREATE | Auto chuyển ongoing/ended |
| `services/notification.service.ts` | MODIFY | Thêm các loại notification mới |
| `dto/event.dto.ts` | MODIFY | Thêm DTO cho các request mới |
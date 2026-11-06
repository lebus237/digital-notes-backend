export type StudentProfileData = {
  id: string
  fullName: string | null
  email: string
  phoneNumber: string
  role: string
  createdAt: string
  universityId: string | null
  universityName: string | null
  facultyId: string | null
  facultyName: string | null
  departmentId: string | null
  departmentName: string | null
  levelId: string | null
  levelName: string | null
  semesterId: string | null
  semesterName: string | null
}

export type UpdateStudentProfilePayload = {
  universityId?: string | null
  facultyId?: string | null
  departmentId?: string | null
  levelId?: string | null
  semesterId?: string | null
}

export interface StudentService {
  viewProfile(userId: string): Promise<StudentProfileData>
  updateProfile(userId: string, payload: UpdateStudentProfilePayload): Promise<StudentProfileData>
  favoriteIds(userId: string): Promise<string[]>
  addFavorite(userId: string, noteId: string): Promise<void>
  removeFavorite(userId: string, noteId: string): Promise<void>
  historyIds(userId: string, limit?: number): Promise<string[]>
  recordView(userId: string, noteId: string): Promise<void>
}

import { z } from 'zod'

// ============================================
// FILE VALIDATION SCHEMAS
// ============================================

export const FileUploadSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  size: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
})

export const AllowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
] as const

// ============================================
// CANDIDATE PROFILE SCHEMAS
// ============================================

export const ContactPersonSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\+?[\d\s()-]+$/, 'Ungültige Telefonnummer'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  website: z.string().url().optional(),
})

export const PersonalDetailSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const ITSkillSchema = z.object({
  skill: z.string(),
  level: z.string(),
})

export const LanguageSchema = z.object({
  lang: z.string(),
  level: z.string(),
})

export const TopSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.any().nullable(),
})

export const KeyProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  scope: z.string(),
  icon: z.any().nullable(),
})

export const ExperienceTimelineSchema = z.object({
  id: z.string(),
  dateRange: z.string(),
  title: z.string(),
  description: z.string(),
})

export const CareerGoalSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.any().nullable(),
})

export const InterestSchema = z.object({
  name: z.string(),
  icon: z.any().nullable(),
})

export const AttachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  url: z.string(),
  file: z.any().optional(),
})

export const CandidateProfileSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  salaryExpectation: z.string(),
  availability: z.string(),
  location: z.string().min(1, 'Standort ist erforderlich'),
  experienceYears: z.string(),
  initials: z.string().max(10),
  contactPerson: ContactPersonSchema,
  profileSummary: z.array(z.string()),
  topSkills: z.array(TopSkillSchema),
  qualifications: z.array(z.string()),
  personalDetails: z.array(PersonalDetailSchema),
  itSkills: z.array(ITSkillSchema),
  languages: z.array(LanguageSchema),
  education: z.array(z.string()),
  keyProjects: z.array(KeyProjectSchema),
  experienceTimeline: z.array(ExperienceTimelineSchema),
  careerGoals: z.array(CareerGoalSchema),
  interests: z.array(InterestSchema),
  personalityTraits: z.array(z.string()),
  motivationFactors: z.array(z.string()),
  attachments: z.array(AttachmentSchema).optional(),
})

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>
export type ContactPerson = z.infer<typeof ContactPersonSchema>
export type ITSkill = z.infer<typeof ITSkillSchema>
export type Language = z.infer<typeof LanguageSchema>
export type KeyProject = z.infer<typeof KeyProjectSchema>
export type ExperienceTimeline = z.infer<typeof ExperienceTimelineSchema>

// ============================================
// FORM DATA SCHEMAS
// ============================================

export const CVUploadFormSchema = z.object({
  cvFile: z.instanceof(File).optional(),
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  position: z.string().min(1, 'Position ist erforderlich').max(100),
  location: z.string().min(1, 'Standort ist erforderlich').max(100),
  salary: z.string().max(100),
  availability: z.string().max(50),
  contactPerson: z.string().max(100),
  contactPhone: z.string().max(50),
  contactEmail: z.string().email('Ungültige E-Mail-Adresse'),
  additionalInfo: z.string().max(5000).optional(),
})

export type CVUploadForm = z.infer<typeof CVUploadFormSchema>

// ============================================
// PARSED CV SCHEMAS (from OpenAI)
// ============================================

export const ParsedCVPersonalInfoSchema = z.object({
  name: z.string(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  location: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

export const ParsedCVExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  dateRange: z.string(),
  description: z.string(),
  responsibilities: z.array(z.string()),
})

export const ParsedCVEducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  dateRange: z.string(),
  details: z.string().optional(),
})

export const ParsedCVLanguageSchema = z.object({
  language: z.string(),
  level: z.string(),
})

export const ParsedCVSkillsSchema = z.object({
  technical: z.array(z.string()),
  soft: z.array(z.string()),
  languages: z.array(ParsedCVLanguageSchema),
})

export const ParsedCVProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  technologies: z.array(z.string()).optional(),
})

export const ParsedCVSchema = z.object({
  personalInfo: ParsedCVPersonalInfoSchema,
  experience: z.array(ParsedCVExperienceSchema),
  education: z.array(ParsedCVEducationSchema),
  skills: ParsedCVSkillsSchema,
  certifications: z.array(z.string()),
  projects: z.array(ParsedCVProjectSchema).optional(),
  summary: z.string(),
  experienceYears: z.string(),
})

export type ParsedCV = z.infer<typeof ParsedCVSchema>
export type ParsedCVExperience = z.infer<typeof ParsedCVExperienceSchema>
export type ParsedCVEducation = z.infer<typeof ParsedCVEducationSchema>

// ============================================
// API RESPONSE SCHEMAS
// ============================================

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
})

export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
})

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>

// ============================================
// ENVIRONMENT SCHEMA
// ============================================

export const EnvironmentSchema = z.object({
  OPENAI_API_KEY: z
    .string()
    .min(1, 'OPENAI_API_KEY ist erforderlich')
    .startsWith('sk-', 'OPENAI_API_KEY muss mit sk- beginnen'),
  OPENAI_MODEL: z.string().optional().default('gpt-4o'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  // Optional: Background-Agent Key (z.B. für externe Worker-Dienste)
  BACKGROUND_AGENT_KEY: z.string().optional(),
})

export type Environment = z.infer<typeof EnvironmentSchema>


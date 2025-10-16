import { describe, it, expect } from 'vitest'
import {
  CVUploadFormSchema,
  ContactPersonSchema,
  CandidateProfileSchema,
  EnvironmentSchema,
  ParsedCVSchema,
} from '../schemas'

describe('CVUploadFormSchema', () => {
  it('should validate correct form data', () => {
    const validData = {
      name: 'Max Mustermann',
      position: 'Software Developer',
      location: 'Berlin',
      salary: '80.000 €',
      availability: '1 Monat',
      contactPerson: 'John Doe',
      contactPhone: '+49 123 456789',
      contactEmail: 'john@example.com',
      additionalInfo: 'Some notes',
    }

    const result = CVUploadFormSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it('should reject invalid email', () => {
    const invalidData = {
      name: 'Max Mustermann',
      position: 'Developer',
      location: 'Berlin',
      contactEmail: 'invalid-email',
      contactPhone: '+49 123',
      salary: '80k',
      availability: '1 Monat',
      contactPerson: 'John',
    }

    expect(() => CVUploadFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject missing required fields', () => {
    const invalidData = {
      position: 'Developer',
      location: 'Berlin',
      contactEmail: 'test@example.com',
    }

    expect(() => CVUploadFormSchema.parse(invalidData)).toThrow()
  })

  it('should allow optional fields to be undefined', () => {
    const minimalData = {
      name: 'Max Mustermann',
      position: 'Developer',
      location: 'Berlin',
      salary: '',
      availability: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: 'test@example.com',
    }

    const result = CVUploadFormSchema.parse(minimalData)
    expect(result.name).toBe('Max Mustermann')
  })
})

describe('ContactPersonSchema', () => {
  it('should validate correct contact person data', () => {
    const validData = {
      name: 'John Doe',
      phone: '+49 123 456789',
      email: 'john@example.com',
      website: 'https://example.com',
    }

    const result = ContactPersonSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it('should reject invalid phone number format', () => {
    const invalidData = {
      name: 'John Doe',
      phone: 'abc-def-ghij', // Invalid
      email: 'john@example.com',
    }

    expect(() => ContactPersonSchema.parse(invalidData)).toThrow()
  })

  it('should accept various phone formats', () => {
    const formats = [
      '+49 123 456789',
      '+1 (555) 123-4567',
      '0123 456789',
      '+49-123-456789',
    ]

    formats.forEach((phone) => {
      const data = {
        name: 'John',
        phone,
        email: 'test@example.com',
      }
      expect(() => ContactPersonSchema.parse(data)).not.toThrow()
    })
  })
})

describe('EnvironmentSchema', () => {
  it('should validate correct environment', () => {
    const validEnv = {
      OPENAI_API_KEY: 'sk-test123',
      OPENAI_MODEL: 'gpt-4o-mini',
      NODE_ENV: 'production',
    }

    const result = EnvironmentSchema.parse(validEnv)
    expect(result.OPENAI_API_KEY).toBe('sk-test123')
    expect(result.NODE_ENV).toBe('production')
  })

  it('should apply defaults', () => {
    const minimalEnv = {
      OPENAI_API_KEY: 'sk-test123',
    }

    const result = EnvironmentSchema.parse(minimalEnv)
    expect(result.NODE_ENV).toBe('development')
    expect(result.OPENAI_MODEL).toBe('gpt-4o-mini')
  })

  it('should reject API key without sk- prefix', () => {
    const invalidEnv = {
      OPENAI_API_KEY: 'invalid-key',
    }

    expect(() => EnvironmentSchema.parse(invalidEnv)).toThrow()
  })

  it('should reject empty API key', () => {
    const invalidEnv = {
      OPENAI_API_KEY: '',
    }

    expect(() => EnvironmentSchema.parse(invalidEnv)).toThrow()
  })
})

describe('ParsedCVSchema', () => {
  it('should validate complete parsed CV', () => {
    const validCV = {
      personalInfo: {
        name: 'Max Mustermann',
        location: 'Berlin',
        email: 'max@example.com',
        phone: '+49 123 456789',
      },
      experience: [
        {
          title: 'Software Developer',
          company: 'Tech Corp',
          dateRange: '2020 - 2023',
          description: 'Developed software',
          responsibilities: ['Code', 'Review', 'Deploy'],
        },
      ],
      education: [
        {
          degree: 'Master of Science',
          institution: 'University',
          dateRange: '2015 - 2018',
        },
      ],
      skills: {
        technical: ['JavaScript', 'TypeScript'],
        soft: ['Communication', 'Teamwork'],
        languages: [
          { language: 'German', level: 'C2' },
          { language: 'English', level: 'B2' },
        ],
      },
      certifications: ['AWS Certified'],
      summary: 'Experienced developer',
      experienceYears: '3+ Jahre',
    }

    const result = ParsedCVSchema.parse(validCV)
    expect(result.personalInfo.name).toBe('Max Mustermann')
    expect(result.experience).toHaveLength(1)
    expect(result.skills.technical).toContain('JavaScript')
  })

  it('should allow optional fields to be missing', () => {
    const minimalCV = {
      personalInfo: {
        name: 'Max',
        location: 'Berlin',
      },
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
        languages: [],
      },
      certifications: [],
      summary: 'Test',
      experienceYears: '< 1 Jahr',
    }

    expect(() => ParsedCVSchema.parse(minimalCV)).not.toThrow()
  })

  it('should coerce arrays when provided', () => {
    const cvWithArrays = {
      personalInfo: {
        name: 'Max',
        location: 'Berlin',
      },
      experience: [],
      education: [],
      skills: {
        technical: ['TypeScript', 'Python'],
        soft: [],
        languages: [],
      },
      certifications: ['Cert1', 'Cert2'],
      summary: 'Test',
      experienceYears: '2 Jahre',
    }

    const result = ParsedCVSchema.parse(cvWithArrays)
    expect(result.skills.technical).toHaveLength(2)
    expect(result.certifications).toHaveLength(2)
  })
})

describe('CandidateProfileSchema', () => {
  it('should validate a complete profile', () => {
    const profile = {
      title: 'Software Developer',
      salaryExpectation: '80.000 €',
      availability: 'Verfügbar in 1 Monat',
      location: 'Berlin',
      experienceYears: '5+ Jahre',
      initials: 'MM',
      contactPerson: {
        name: 'John Doe',
        phone: '+49 123',
        email: 'john@example.com',
        website: 'https://example.com',
      },
      profileSummary: ['Summary line 1', 'Summary line 2'],
      topSkills: [],
      qualifications: [],
      personalDetails: [],
      itSkills: [],
      languages: [],
      education: [],
      keyProjects: [],
      experienceTimeline: [],
      careerGoals: [],
      interests: [],
      personalityTraits: [],
      motivationFactors: [],
    }

    expect(() => CandidateProfileSchema.parse(profile)).not.toThrow()
  })

  it('should reject profile with missing required fields', () => {
    const invalidProfile = {
      salaryExpectation: '80k',
      // Missing title, location, etc.
    }

    expect(() => CandidateProfileSchema.parse(invalidProfile)).toThrow()
  })
})


export const CV_PARSING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['personalInfo', 'experience', 'education', 'skills'],
  properties: {
    personalInfo: {
      type: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
        linkedin: { type: 'string' },
        github: { type: 'string' },
      },
    },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['company', 'position'],
        properties: {
          company: { type: 'string' },
          position: { type: 'string' },
          duration: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          description: { type: 'string' },
          achievements: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['institution', 'degree'],
        properties: {
          institution: { type: 'string' },
          degree: { type: 'string' },
          field: { type: 'string' },
          duration: { type: 'string' },
          graduation: { type: 'string' },
        },
      },
    },
    skills: {
      type: 'object',
      additionalProperties: false,
      properties: {
        technical: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } },
        soft: { type: 'array', items: { type: 'string' } },
      },
    },
    summary: { type: 'string' },
  },
} as const



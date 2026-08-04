import Joi from 'joi';

export const reportCommonSchema = Joi.object({
  indicator: Joi.string().optional(),
  startDate: Joi.string().required(),
  endDate: Joi.string().required(),
  codeCompany: Joi.string().optional(),
  codProduct: Joi.string().optional(),
  istance: Joi.string().optional(),
  profile: Joi.string().optional(),
  user: Joi.string().optional(),
  codeDiagnostic: Joi.string().optional(),
  codeSpecialty: Joi.string().optional(),
  codeClinic: Joi.string().optional(),
  codeMedical: Joi.string().optional(),
  codDoctor: Joi.string().optional(),
  codEspecial: Joi.string().optional(),
  codeProvider: Joi.string().optional(),
  standardTime: Joi.string().optional(),
  typeCase: Joi.string().optional(),
});

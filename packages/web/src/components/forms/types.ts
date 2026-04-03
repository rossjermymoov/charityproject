export type FieldType =
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX"
  | "RADIO"
  | "FILE"
  | "HIDDEN";

export interface FieldOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  type: "minLength" | "maxLength" | "pattern" | "custom";
  value?: string | number;
  message?: string;
}

export interface ConditionalLogic {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
  value: string | number | boolean;
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: FieldOption[];
  validationRules?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  order: number;
}

export interface FormDefinition {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings?: {
    primaryColor?: string;
    thankYouMessage?: string;
    redirectUrl?: string;
  };
}

export interface FormSubmissionData {
  [key: string]: string | number | boolean | string[] | File | undefined;
}

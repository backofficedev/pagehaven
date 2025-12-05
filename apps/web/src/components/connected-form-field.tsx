import { FormField } from "./form-field";

type FieldState = {
  name: string;
  state: {
    value: string;
    meta: { errors: ReadonlyArray<{ message?: string } | undefined> };
  };
  handleBlur: () => void;
  handleChange: (value: string) => void;
};

type ConnectedFormFieldProps = {
  form: unknown;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
};

/**
 * A connected form field that integrates with TanStack Form.
 * Reduces boilerplate by handling the field subscription and prop mapping.
 */
export function ConnectedFormField({
  form,
  name,
  label,
  type = "text",
}: Readonly<ConnectedFormFieldProps>) {
  const typedForm = form as {
    Field: React.ComponentType<{
      name: string;
      children: (field: FieldState) => React.ReactNode;
    }>;
  };
  const FormFieldComponent = typedForm.Field;

  return (
    <FormFieldComponent name={name}>
      {(field) => (
        <FormField
          errors={field.state.meta.errors}
          label={label}
          name={field.name}
          onBlur={field.handleBlur}
          onChange={field.handleChange}
          type={type}
          value={field.state.value}
        />
      )}
    </FormFieldComponent>
  );
}

import { Input } from "./ui/input";
import { Label } from "./ui/label";

type FormFieldProps = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  errors: Array<{ message?: string } | undefined>;
  onBlur: () => void;
  onChange: (value: string) => void;
};

export function FormField({
  name,
  label,
  type = "text",
  value,
  errors,
  onBlur,
  onChange,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        value={value}
      />
      {errors.map((error) => (
        <p className="text-red-500" key={error?.message}>
          {error?.message}
        </p>
      ))}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  error?: string;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
};

export function TextField({ label, name, error, multiline, ...inputProps }: TextFieldProps) {
  const errorId = `${name}-error`;
  const controlProps = {
    id: name,
    name,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    className: `rounded border bg-transparent px-3 py-2 ${
      error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
    }`,
    ...inputProps,
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {multiline ? <textarea rows={10} {...controlProps} /> : <input type="text" {...controlProps} />}
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

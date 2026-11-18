"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/Input";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  invalid?: boolean;
  trailingCheck?: React.ReactNode;
}

export function PasswordInput({
  invalid,
  trailingCheck,
  ...rest
}: Readonly<PasswordInputProps>) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      inputSize="lg"
      type={visible ? "text" : "password"}
      invalid={invalid}
      trailingSlot={
        <div className="flex items-center gap-1.5">
          {trailingCheck}
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="inline-flex size-6 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:text-fg"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      }
      {...rest}
    />
  );
}

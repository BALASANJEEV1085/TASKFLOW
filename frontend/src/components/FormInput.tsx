import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
  helperText?: string;
  success?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, helperText, success, type, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        <label className="block mb-2 text-foreground">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`w-full px-4 ${icon ? 'pl-10' : ''} ${
              isPassword ? 'pr-10' : ''
            } py-2.5 bg-input-background border rounded-lg transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              error
                ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
                : success
                ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
                : 'border-border'
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-destructive text-sm">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-muted-foreground text-sm">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

'use client';

import { Globe, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IpAddressManagerProps } from '@/types/organisation';

const IPV4_REGEX =
  /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export default function IpAddressManager({
  ipAddresses,
  isLoadingIp,
  onGetCurrentIp,
  onRemoveIp,
  onAddIp,
  onUpdateIp,
}: IpAddressManagerProps) {
  const [inputFields, setInputFields] = useState<string[]>(
    ipAddresses.length > 0 ? ipAddresses : ['']
  );
  const [errors, setErrors] = useState<Record<number, string>>({});
  const prevIpAddressesLengthRef = useRef<number>(ipAddresses.length);

  // Sync when ipAddresses changes (detect length change using ref)
  useEffect(() => {
    if (ipAddresses.length !== prevIpAddressesLengthRef.current) {
      prevIpAddressesLengthRef.current = ipAddresses.length;

      if (ipAddresses.length > 0) {
        setInputFields((prevInputFields) => {
          // If we only had one empty field, replace it
          if (prevInputFields.length === 1 && prevInputFields[0] === '') {
            return ipAddresses;
          }
          // Update existing fields but keep any extra empty fields user added
          const updatedFields = [...ipAddresses];
          // Add back any empty fields that user might have added
          const emptyFields = prevInputFields.filter(
            (field, idx) => field === '' && idx >= ipAddresses.length
          );
          return [...updatedFields, ...emptyFields];
        });
      }
    }
  }, [ipAddresses]);

  const handleAddField = () => {
    setInputFields([...inputFields, '']);
  };

  const handleRemoveField = (index: number) => {
    if (inputFields.length === 1) {
      return;
    }

    const newFields = inputFields.filter((_, i) => i !== index);
    setInputFields(newFields);

    // Only remove from parent if it was a valid IP
    if (index < ipAddresses.length) {
      onRemoveIp(index);
    }

    // Remove error for this field
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleInputChange = (index: number, value: string) => {
    const newFields = [...inputFields];
    newFields[index] = value;
    setInputFields(newFields);

    // Clear error when user types
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }

    // Update parent component only if valid
    const trimmedValue = value.trim();
    if (
      trimmedValue &&
      (IPV4_REGEX.test(trimmedValue) || IPV6_REGEX.test(trimmedValue))
    ) {
      onUpdateIp(index, trimmedValue);
    }
  };

  const validateIpAddress = (ip: string): boolean => {
    const trimmedIp = ip.trim();
    return IPV4_REGEX.test(trimmedIp) || IPV6_REGEX.test(trimmedIp);
  };

  const handleBlur = (index: number) => {
    const ip = inputFields[index].trim();
    if (!ip) {
      return;
    }

    if (validateIpAddress(ip)) {
      // Add valid IP to parent state
      onAddIp(ip);
    } else {
      setErrors((prev) => ({
        ...prev,
        [index]: 'Invalid IP address format (IPv4 or IPv6)',
      }));
    }
  };

  return (
    <div className="space-y-4">
      <Label>IP Addresses</Label>

      {/* Get Current IP Button */}
      <div className="flex gap-2">
        <Button
          className="w-full"
          disabled={isLoadingIp}
          onClick={onGetCurrentIp}
          size="lg"
          title="Get My IP Address"
          type="button"
          variant="outline"
        >
          {isLoadingIp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching IP...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Get My IP Address
            </>
          )}
        </Button>
      </div>

      {/* IP Address Input Fields */}
      <div className="space-y-3">
        {inputFields?.map((ip, index) => (
          <div className="flex gap-2" key={index as number}>
            <div className="flex-1">
              <Input
                className={errors[index] ? 'border-destructive' : ''}
                onBlur={() => handleBlur(index)}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder="Enter IP address (e.g., 192.168.1.1 or 2001:db8::1)"
                type="text"
                value={ip}
              />
              {errors[index] && (
                <p className="mt-1 text-destructive text-sm">{errors[index]}</p>
              )}
            </div>
            <Button
              className="shrink-0"
              disabled={inputFields.length === 1}
              onClick={() => handleRemoveField(index)}
              size="icon"
              title="Remove IP Address"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add More Button */}
      <Button
        className="w-full"
        onClick={handleAddField}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add More IP Address
      </Button>

      {/* Summary of Valid IPs */}
      {ipAddresses && ipAddresses.length > 0 && (
        <div className="rounded-md border bg-muted p-3">
          <p className="mb-2 font-medium text-sm">
            Valid IP Addresses ({ipAddresses.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {ipAddresses?.map((ip, index) => (
              <span
                className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs"
                key={index as number}
              >
                {ip}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        You can manually enter IP addresses or click &quot;Get My IP
        Address&quot; to fetch your current IP
      </p>
    </div>
  );
}

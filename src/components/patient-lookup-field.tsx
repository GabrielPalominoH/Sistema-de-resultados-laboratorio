import { useState, useRef, useCallback } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import { Loader2, CheckCircle2, UserPlus, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PatientRegisterModal } from './patient-register-modal';
import { PatientEditModal } from './patient-edit-modal';
import { searchPatientsByDni } from '@/lib/db';
import type { PatientLookupResult } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

interface PatientLookupFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  disabled?: boolean;
  placeholder?: string;
  setValue: UseFormSetValue<any>;
}

export function PatientLookupField({
  value,
  onChange,
  onBlur,
  name,
  disabled,
  placeholder,
  setValue,
}: PatientLookupFieldProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<LookupStatus>('idle');
  const [suggestions, setSuggestions] = useState<PatientLookupResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientLookupResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const populateForm = useCallback((patient: PatientLookupResult) => {
    setValue('patientName', patient.fullName, { shouldValidate: true, shouldDirty: true });
    setValue('patientAge', String(patient.age), { shouldValidate: true, shouldDirty: true });
    setValue('hcn', patient.hcn ?? '', { shouldValidate: true, shouldDirty: true });
    setValue('phone', patient.phone ?? '', { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  const clearForm = useCallback(() => {
    setValue('patientName', '', { shouldValidate: false, shouldDirty: true });
    setValue('patientAge', '', { shouldValidate: false, shouldDirty: true });
    setValue('hcn', '', { shouldValidate: false, shouldDirty: true });
    setValue('phone', '', { shouldValidate: false, shouldDirty: true });
  }, [setValue]);

  const triggerSearch = useCallback(async (prefix: string) => {
    setStatus('loading');
    try {
      const results = await searchPatientsByDni(prefix);
      if (results.length === 0) {
        setSuggestions([]);
        setShowDropdown(false);
        setStatus('not-found');
      } else if (results.length === 1 && results[0].dni === prefix) {
        setSuggestions([]);
        setShowDropdown(false);
        setStatus('found');
        setSelectedPatient(results[0]);
        populateForm(results[0]);
      } else {
        setSuggestions(results);
        setShowDropdown(true);
        setStatus('idle');
        clearForm();
      }
    } catch {
      setStatus('error');
      setShowDropdown(false);
    }
  }, [populateForm, clearForm]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setStatus('idle');
    setSuggestions([]);
    setShowDropdown(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!newValue.trim()) {
      clearForm();
      return;
    }
    debounceTimer.current = setTimeout(() => triggerSearch(newValue.trim()), 350);
  };

  const handleSelect = (patient: PatientLookupResult) => {
    if (patient.dni) onChange(patient.dni);
    populateForm(patient);
    setStatus('found');
    setSelectedPatient(patient);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    onBlur();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const handlePatientRegistered = useCallback((patient: PatientLookupResult) => {
    if (patient.dni) onChange(patient.dni);
    setStatus('found');
    setSelectedPatient(patient);
    populateForm(patient);
    setModalOpen(false);
    toast({
      title: 'Paciente registrado',
      description: `${patient.fullName} fue registrado y los datos se cargaron automáticamente.`,
    });
  }, [populateForm, toast, onChange]);

  const handlePatientUpdated = useCallback((patient: PatientLookupResult) => {
    setSelectedPatient(patient);
    populateForm(patient);
    setEditModalOpen(false);
    toast({
      title: 'Paciente actualizado',
      description: `Los datos de ${patient.fullName} fueron actualizados.`,
    });
  }, [populateForm, toast]);

  return (
    <>
      <div className="relative">
        <Input
          name={name}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={status === 'found' ? 'pr-16' : 'pr-10'}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {status === 'loading' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {status === 'found' && (
            <div className="flex items-center gap-0.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditModalOpen(true)}
                title="Editar datos del paciente"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
          {status === 'not-found' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setModalOpen(true)}
              title="Registrar nuevo paciente"
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-52 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {suggestions.map((patient) => (
              <button
                key={patient.dni}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-3 border-b last:border-b-0"
                onClick={() => handleSelect(patient)}
              >
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{patient.dni}</span>
                <span className="truncate">{patient.fullName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <PatientRegisterModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          dni={value}
          onPatientRegistered={handlePatientRegistered}
        />
      )}

      {editModalOpen && selectedPatient && (
        <PatientEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          patient={selectedPatient}
          onPatientUpdated={handlePatientUpdated}
        />
      )}
    </>
  );
}

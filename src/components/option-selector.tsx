
'use client';

import { MainHeader } from "./layout/main-header";
import { Button } from "./ui/button";
import { PersonalInfoOption } from "@/types";
import { Check } from "lucide-react";

interface OptionSelectorProps {
    option: PersonalInfoOption;
    currentValue?: string;
    onSelect: (value: string) => void;
    onBack: () => void;
}

export function OptionSelector({ option, currentValue, onSelect, onBack }: OptionSelectorProps) {
    return (
        <div>
            <MainHeader title={option.label} showBackButton={true} />
            <div className="p-4 space-y-2">
                {option.options.map((opt) => (
                    <Button 
                        key={opt}
                        variant={currentValue === opt ? 'default' : 'outline'}
                        className="w-full justify-between py-6 text-base"
                        onClick={() => onSelect(opt)}
                    >
                        <span>{opt}</span>
                        {currentValue === opt && <Check className="h-5 w-5" />}
                    </Button>
                ))}
            </div>
        </div>
    )
}

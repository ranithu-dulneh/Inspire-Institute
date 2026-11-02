import React, { useState, useEffect } from 'react';
import { InspireLogo } from './InspireLogo';
import { ArrowLeft, ArrowRight, Globe, Building2, MapPin, Sparkles } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export interface Institution {
  id: string;
  name: string;
  location: string;
  tag: string;
  description: string;
  isDefault?: boolean;
  badge?: string;
  color: string;
}

interface InstitutionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInstitute: (institute: Institution) => void;
}

export const institutionsList: Institution[] = [
  {
    id: 'online',
    name: 'Inspire Online',
    location: 'Islandwide Online',
    tag: 'ONLINE NETWORK',
    description: 'Accessible from anywhere through Inspire Education LMS — study from home.',
    isDefault: true,
    badge: 'Default',
    color: 'from-emerald-950 via-teal-950 to-slate-900 border-emerald-500/50'
  },
  {
    id: 'ziyon',
    name: 'Ziyon Academy',
    location: 'Kurunegala – Ziyon',
    tag: 'KURUNEGALA CENTER',
    description: 'Strong physical class presence with structured Accounting guidance.',
    color: 'bg-white border-slate-200 hover:border-blue-400'
  },
  {
    id: 'ims',
    name: 'IMS Kandy',
    location: 'Kandy – IMS',
    tag: 'KANDY CENTER',
    description: 'Trusted learning environment for city-based students.',
    color: 'bg-white border-slate-200 hover:border-blue-400'
  },
  {
    id: 'apex',
    name: 'Apex Academy',
    location: 'Kegalle – Apex',
    tag: 'KEGALLE CENTER',
    description: 'Reach students through consistent, high-quality instruction.',
    color: 'bg-white border-slate-200 hover:border-blue-400'
  }
];

export const InstitutionSelectModal: React.FC<InstitutionSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectInstitute
}) => {
  const [dynamicInstitutions, setDynamicInstitutions] = useState<Institution[]>(institutionsList);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const dbInsts = await supabaseService.getInstitutions();
        const active = dbInsts.filter(i => i.is_active);
        if (active.length > 0) {
          const mapped: Institution[] = active.map(i => {
            const isOnline = i.name.toLowerCase().includes('online');
            return {
              id: i.id,
              name: i.name,
              location: i.location || (isOnline ? 'Islandwide Online' : 'Regional Branch'),
              tag: isOnline ? 'ONLINE NETWORK' : `${(i.location || 'REGIONAL').toUpperCase()} CENTER`,
              description: isOnline 
                ? 'Accessible from anywhere through Inspire Education LMS — study from home.' 
                : 'Direct physical lecture attendance with personalized attention and discussion sessions.',
              isDefault: isOnline,
              badge: isOnline ? 'Default' : undefined,
              color: isOnline ? 'from-emerald-950 via-teal-950 to-slate-900 border-emerald-500/50' : 'bg-white border-slate-200 hover:border-blue-400'
            };
          });
          setDynamicInstitutions(mapped);
        }
      } catch {}
    };

    if (isOpen) {
      loadInstitutions();
    }

    window.addEventListener('inspire-institutions-updated', loadInstitutions);
    return () => window.removeEventListener('inspire-institutions-updated', loadInstitutions);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-white via-slate-50/90 to-blue-50/30 rounded-[36px] border border-white/90 shadow-2xl p-6 sm:p-10 text-center space-y-8 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header bar with Logo and Back Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <InspireLogo size="md" />

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Header Title Section */}
        <div className="space-y-3 max-w-xl mx-auto">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            SIGN UP · SELECT YOUR INSTITUTE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Choose where you study
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Select your physical branch or online platform to proceed with your enrollment.
          </p>
        </div>

        {/* 2x2 Institutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {dynamicInstitutions.map((inst) => {
            const isOnline = inst.id === 'online' || inst.name.toLowerCase().includes('online');
            return (
              <div
                key={inst.id}
                onClick={() => onSelectInstitute(inst)}
                className={`group relative p-6 sm:p-7 rounded-[28px] border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-6 ${
                  isOnline
                    ? 'bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white border-emerald-500/40 shadow-xl hover:shadow-2xl hover:scale-[1.01]'
                    : 'bg-white/90 hover:bg-white border-slate-200/80 hover:border-blue-400 text-slate-900 shadow-sm hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Tag & Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-sans font-semibold tracking-wider uppercase ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {inst.tag}
                    </span>
                    {inst.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                        {inst.badge}
                      </span>
                    )}
                  </div>

                  {/* Icon / Brand Box */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs ${
                      isOnline 
                        ? 'bg-emerald-500 text-slate-950 font-black' 
                        : 'bg-gradient-to-tr from-blue-500 to-sky-400 text-white'
                    }`}>
                      {inst.name.charAt(0)}
                    </div>
                    <div>
                      <span className={`text-xs block font-semibold ${isOnline ? 'text-emerald-300' : 'text-slate-500'}`}>
                        {inst.location}
                      </span>
                      <h3 className={`text-xl font-bold tracking-tight ${isOnline ? 'text-white' : 'text-slate-900'}`}>
                        {inst.name}
                      </h3>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed ${isOnline ? 'text-slate-300' : 'text-slate-600'}`}>
                    {inst.description}
                  </p>
                </div>

                {/* Bottom Action */}
                <div className={`pt-4 border-t flex items-center justify-between text-xs font-semibold ${
                  isOnline 
                    ? 'border-white/10 text-emerald-400 group-hover:text-emerald-300' 
                    : 'border-slate-100 text-blue-600 group-hover:text-blue-700'
                }`}>
                  <span>Select &amp; Register</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

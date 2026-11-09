import { useT } from "../i18n/index";
import React, { useState } from 'react';
import StepShell from '../components/PlanWizard/StepShell';
const TRIP_TYPES = [{
  id: 'solo',
  label: 'Solo',
  icon: 'person',
  counts: {
    adults: 1,
    children: 0,
    seniors: 0
  }
}, {
  id: 'couple',
  label: 'Couple',
  icon: 'favorite',
  counts: {
    adults: 2,
    children: 0,
    seniors: 0
  }
}, {
  id: 'family',
  label: 'Family',
  icon: 'family_restroom',
  counts: {
    adults: 2,
    children: 2,
    seniors: 0
  }
}, {
  id: 'friends',
  label: 'Friends',
  icon: 'groups',
  counts: {
    adults: 4,
    children: 0,
    seniors: 0
  }
}, {
  id: 'senior',
  label: 'Senior citizens',
  icon: 'elderly',
  counts: {
    adults: 1,
    children: 0,
    seniors: 2
  }
}];
const PACES = [{
  id: 'relaxed',
  label: 'Relaxed',
  desc: '2 stops a day'
}, {
  id: 'balanced',
  label: 'Balanced',
  desc: '3 stops a day'
}, {
  id: 'packed',
  label: 'Packed',
  desc: '4 stops a day'
}];
const NEEDS = [{
  id: 'limited_walking',
  label: 'Limited walking',
  icon: 'accessible'
}, {
  id: 'step_free',
  label: 'Step-free access',
  icon: 'wheelchair_pickup'
}, {
  id: 'frequent_rest',
  label: 'Frequent rest stops',
  icon: 'chair'
}, {
  id: 'vegetarian',
  label: 'Vegetarian food',
  icon: 'restaurant'
}, {
  id: 'budget',
  label: 'Keep costs low',
  icon: 'savings'
}, {
  id: 'quiet',
  label: 'Quiet spaces',
  icon: 'volume_off'
}];
const INTERESTS = [{
  id: 'heritage',
  label: 'Heritage',
  icon: 'account_balance'
}, {
  id: 'spiritual',
  label: 'Spiritual',
  icon: 'self_improvement'
}, {
  id: 'culture',
  label: 'Culture',
  icon: 'theater_comedy'
}, {
  id: 'architecture',
  label: 'Architecture',
  icon: 'apartment'
}, {
  id: 'photography',
  label: 'Photography',
  icon: 'photo_camera'
}];
function Counter({
  label,
  icon,
  value,
  min,
  onChange
}) {
  const t = useT();
  return <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-xs font-semibold text-on-surface">
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="min-h-11 min-w-11 rounded-full border border-outline-variant/50 flex items-center justify-center disabled:opacity-30 hover:bg-surface-container-low" title={`Fewer ${label.toLowerCase()}`}>
          <span className="material-symbols-outlined text-[16px]">remove</span>
        </button>
        <span className="w-7 text-center font-display text-lg font-bold text-primary">{value}</span>
        <button onClick={() => onChange(Math.min(12, value + 1))} disabled={value >= 12} className="min-h-11 min-w-11 rounded-full border border-outline-variant/50 flex items-center justify-center disabled:opacity-30 hover:bg-surface-container-low" title={`More ${label.toLowerCase()}`}>
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>
      </div>
    </div>;
}
export default function GroupDetailsView({
  group,
  onContinue,
  onBack
}) {
  const t = useT();
  const [tripType, setTripType] = useState(group?.tripType || null);
  const [counts, setCounts] = useState(group?.counts || {
    adults: 2,
    children: 0,
    seniors: 0
  });
  const [pace, setPace] = useState(group?.pace || 'balanced');
  const [needs, setNeeds] = useState(group?.needs || []);
  const [interests, setInterests] = useState(group?.interests || []);
  const pickType = type => {
    setTripType(type.id);
    setCounts(type.counts);
  };
  const toggle = (list, setter, id) => {
    setter(list.includes(id) ? list.filter(entry => entry !== id) : [...list, id]);
  };
  const totalPeople = counts.adults + counts.children + counts.seniors;
  return <StepShell step={5} title={t("text|Tell us about your group")} subtitle={t('group.subtitle')} onBack={onBack} footer={<button onClick={() => onContinue({
    tripType,
    counts,
    pace,
    needs,
    interests
  })} disabled={!tripType || totalPeople < 1} className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40">
          <span>{t("text|Continue")}</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>}>
      <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm space-y-3">
        <h3 className="font-sans font-bold text-sm text-primary">{t("text|Trip type")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRIP_TYPES.map(type => {
          const isSelected = tripType === type.id;
          return <button key={type.id} onClick={() => pickType(type)} className={`p-3 rounded-2xl border text-left transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/50 hover:bg-surface-container-low'}`}>
                <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary' : 'text-outline'}`}>
                  {type.icon}
                </span>
                <p className={`font-sans text-xs font-bold mt-1 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                  {t(`group.type.${type.id}`)}
                </p>
              </button>;
        })}
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm mt-3">
        <h3 className="font-sans font-bold text-sm text-primary mb-1">{t("text|Who is travelling")}</h3>
        <div className="divide-y divide-outline-variant/20">
          <Counter label="Adults (18–59)" icon="person" value={counts.adults} min={0} onChange={value => setCounts(prev => ({
          ...prev,
          adults: value
        }))} />
          <Counter label="Children (under 18)" icon="child_care" value={counts.children} min={0} onChange={value => setCounts(prev => ({
          ...prev,
          children: value
        }))} />
          <Counter label="Seniors (60+)" icon="elderly" value={counts.seniors} min={0} onChange={value => setCounts(prev => ({
          ...prev,
          seniors: value
        }))} />
        </div>
        <p className="text-[11px] text-outline mt-1">{totalPeople}{t("text|traveller")}{totalPeople === 1 ? '' : 's'}</p>
      </section>

      <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm mt-3">
        <h3 className="font-sans font-bold text-sm text-primary mb-3">{t("text|Pace")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {PACES.map(option => {
          const isSelected = pace === option.id;
          return <button key={option.id} onClick={() => setPace(option.id)} className={`p-3 rounded-2xl border text-center transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/50 hover:bg-surface-container-low'}`}>
                <p className={`font-sans text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                  {t(`group.pace.${option.id}`)}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{t(`group.paceHelp.${option.id}`)}</p>
              </button>;
        })}
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm mt-3">
        <h3 className="font-sans font-bold text-sm text-primary mb-3">{t("text|Needs")}</h3>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map(need => {
          const isSelected = needs.includes(need.id);
          return <button key={need.id} onClick={() => toggle(needs, setNeeds, need.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${isSelected ? 'bg-secondary text-on-secondary border-secondary' : 'bg-surface border-outline-variant/50 text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[14px]">{need.icon}</span>
                {t(`group.need.${need.id}`)}
              </button>;
        })}
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm mt-3 mb-2">
        <h3 className="font-sans font-bold text-sm text-primary mb-3">{t("text|Interests")}</h3>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => {
          const isSelected = interests.includes(interest.id);
          return <button key={interest.id} onClick={() => toggle(interests, setInterests, interest.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${isSelected ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant/50 text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[14px]">{interest.icon}</span>
                {t(`group.interest.${interest.id}`)}
              </button>;
        })}
        </div>
      </section>
    </StepShell>;
}

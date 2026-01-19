import React from 'react';

interface BadgeProps {
  colorClass: string;
  label: string;
}

export const Badge: React.FC<BadgeProps> = ({ colorClass, label }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};
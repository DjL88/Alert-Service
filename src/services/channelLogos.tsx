import { brandFor } from '../../shared/channels';
import React from 'react';
import { ChannelConfig, ChannelId } from '../types';

export const DEFAULT_CHANNELS: Record<string, ChannelConfig> = {
  deliveroo: {
    id: 'deliveroo',
    name: 'Deliveroo',
    brandColor: '#00CDBC',
    textColor: '#FFFFFF',
    badgeBg: '#E6FAF8',
    badgeBorder: '#99F6E4',
    logoSvg: 'deliveroo',
  },
  uber_eats: {
    id: 'uber_eats',
    name: 'Uber Eats',
    brandColor: '#06C167',
    textColor: '#FFFFFF',
    badgeBg: '#EBFBF2',
    badgeBorder: '#A7F3D0',
    logoSvg: 'uber_eats',
  },
  just_eat: {
    id: 'just_eat',
    name: 'Just Eat',
    brandColor: '#FF8000',
    textColor: '#FFFFFF',
    badgeBg: '#FFF5EB',
    badgeBorder: '#FED7AA',
    logoSvg: 'just_eat',
  },
  doordash: {
    id: 'doordash',
    name: 'DoorDash',
    brandColor: '#FF3008',
    textColor: '#FFFFFF',
    badgeBg: '#FFF1EF',
    badgeBorder: '#FECACA',
    logoSvg: 'doordash',
  },
  wolt: {
    id: 'wolt',
    name: 'Wolt',
    brandColor: '#009DE0',
    textColor: '#FFFFFF',
    badgeBg: '#EBF6FC',
    badgeBorder: '#BAE6FD',
    logoSvg: 'wolt',
  },
  direct_web: {
    id: 'direct_web',
    name: 'Store Online',
    brandColor: '#00D084', // Deliverect Retail Green
    textColor: '#FFFFFF',
    badgeBg: '#E6FAF2',
    badgeBorder: '#A7F3D0',
    logoSvg: 'direct_web',
  },
};

interface ChannelLogoProps {
  channelId: ChannelId;
  customChannels?: Record<string, ChannelConfig>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  channelId,
  customChannels = {},
  className = '',
  size = 'md',
}) => {
  const channel = customChannels[channelId] || DEFAULT_CHANNELS[channelId] || {
    id: channelId,
    name: channelId,
    brandColor: '#64748B',
    textColor: '#FFFFFF',
    badgeBg: '#F1F5F9',
    badgeBorder: '#CBD5E1',
  };

  const dim = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  const brand = !channel.isCustom && brandFor(channel.name);
  if (brand) return <img src={`/brand/channels/${brand[0]}.png`} alt={channel.name} title={channel.name} className={`object-contain shrink-0 ${dim} ${className}`} />;

  // Custom channel with uploaded image or data URL
  if (channel.isCustom && channel.logoSvg && channel.logoSvg.startsWith('data:image')) {
    return (
      <img
        src={channel.logoSvg}
        alt={channel.name}
        className={`rounded-md object-cover shrink-0 ${dim} ${className}`}
      />
    );
  }

  if (channel.id === 'deliveroo') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold text-white shrink-0 shadow-2xs ${dim} ${className}`}
        style={{ backgroundColor: channel.brandColor }}
        title="Deliveroo"
      >
        <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 fill-current" aria-label="Deliveroo">
          <path d="M18.8 6.5c-.3-.8-1.1-1.3-2-1.3-.3 0-.6.1-.9.2L12 7.2 8.1 5.4c-.3-.1-.6-.2-.9-.2-.9 0-1.7.5-2 1.3L3.1 12c-.2.5-.1 1.1.2 1.5l6.5 8c.4.5 1 .8 1.6.8h1.2c.6 0 1.2-.3 1.6-.8l6.5-8c.3-.4.4-1 .2-1.5l-2.1-5.5zM12 17.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" />
          <circle cx="10" cy="14" r="1.2" fill="#FFFFFF" />
          <circle cx="14" cy="14" r="1.2" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  if (channel.id === 'uber_eats') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-black text-white shrink-0 tracking-tighter shadow-2xs ${dim} ${className}`}
        style={{ backgroundColor: channel.brandColor }}
        title="Uber Eats"
      >
        <span className={size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-sm' : 'text-xs'}>
          UE
        </span>
      </span>
    );
  }

  if (channel.id === 'just_eat') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold text-white shrink-0 shadow-2xs ${dim} ${className}`}
        style={{ backgroundColor: channel.brandColor }}
        title="Just Eat"
      >
        <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-current" aria-label="Just Eat">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
        </svg>
      </span>
    );
  }

  if (channel.id === 'doordash') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold text-white shrink-0 shadow-2xs ${dim} ${className}`}
        style={{ backgroundColor: channel.brandColor }}
        title="DoorDash"
      >
        <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 fill-current" aria-label="DoorDash">
          <path d="M22.7 8.5H11.5c-2.3 0-4.2 1.8-4.2 4.1 0 2.3 1.9 4.1 4.2 4.1h7.4c.5 0 .9-.4.9-.9s-.4-.9-.9-.9h-7.4c-1.3 0-2.4-1.1-2.4-2.3 0-1.3 1.1-2.3 2.4-2.3h11.2c.5 0 .9-.4.9-.9s-.4-.9-.9-.9z" />
        </svg>
      </span>
    );
  }

  if (channel.id === 'wolt') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-black text-white shrink-0 tracking-tighter shadow-2xs ${dim} ${className}`}
        style={{ backgroundColor: channel.brandColor }}
        title="Wolt"
      >
        <span className={size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]'}>
          W
        </span>
      </span>
    );
  }

  if (channel.id === 'direct_web') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold text-white shrink-0 shadow-2xs ${dim} ${className}`}
        style={{ backgroundColor: channel.brandColor }}
        title="Deliverect Retail Direct"
      >
        <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-current" aria-label="Direct">
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-bold text-white shrink-0 uppercase shadow-2xs ${dim} ${className}`}
      style={{ backgroundColor: channel.brandColor }}
      title={channel.name}
    >
      <span className={size === 'sm' ? 'text-[8px]' : 'text-[10px]'}>
        {channel.name.slice(0, 2)}
      </span>
    </span>
  );
};

export const ChannelBadge: React.FC<{
  channelId: ChannelId;
  customChannels?: Record<string, ChannelConfig>;
  className?: string;
}> = ({ channelId, customChannels = {}, className = '' }) => {
  const channel = customChannels[channelId] || DEFAULT_CHANNELS[channelId] || {
    id: channelId,
    name: channelId,
    brandColor: '#64748B',
    textColor: '#334155',
    badgeBg: '#F1F5F9',
    badgeBorder: '#CBD5E1',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${className}`}
      style={{
        backgroundColor: channel.badgeBg,
        borderColor: channel.badgeBorder,
        color: channel.brandColor,
      }}
    >
      <ChannelLogo channelId={channelId} customChannels={customChannels} size="sm" />
      <span className="text-slate-800">{channel.name}</span>
    </div>
  );
};

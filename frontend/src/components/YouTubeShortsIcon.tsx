import React from 'react';

const YouTubeShortsIcon = ({ size = 22, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g>
      <rect width="48" height="48" rx="12" fill="#fff" fillOpacity="0"/>
      <path d="M19.5 8.5C20.5 6.5 23.5 6.5 24.5 8.5L36.5 32.5C37.5 34.5 35.5 36.5 33.5 35.5L11.5 25.5C9.5 24.5 9.5 21.5 11.5 20.5L33.5 10.5C35.5 9.5 37.5 11.5 36.5 13.5L24.5 37.5C23.5 39.5 20.5 39.5 19.5 37.5L7.5 13.5C6.5 11.5 8.5 9.5 10.5 10.5L32.5 20.5C34.5 21.5 34.5 24.5 32.5 25.5L10.5 35.5C8.5 36.5 6.5 34.5 7.5 32.5L19.5 8.5Z" fill="#FF0000"/>
      <rect x="18" y="18" width="12" height="12" rx="6" fill="#fff"/>
      <polygon points="22,21 28,24 22,27" fill="#FF0000"/>
    </g>
  </svg>
);

export default YouTubeShortsIcon;

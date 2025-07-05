import React from 'react';

const DumbbellIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.25,10H18V6a2,2,0,0,0-2-2H14V2.75a.75.75,0,0,0-1.5,0V4H11V2.75a.75.75,0,0,0-1.5,0V4H8V2.75a.75.75,0,0,0-1.5,0V4H5.75a.75.75,0,0,0,0,1.5H7V10H2.75a.75.75,0,0,0,0,1.5H4v4H2.75a.75.75,0,0,0,0,1.5H4V20a2,2,0,0,0,2,2H8v1.25a.75.75,0,0,0,1.5,0V22h1.5v1.25a.75.75,0,0,0,1.5,0V22h1.5v1.25a.75.75,0,0,0,1.5,0V22h2a2,2,0,0,0,2-2V17h1.25a.75.75,0,0,0,0-1.5H18V11.5h3.25a.75.75,0,0,0,0-1.5ZM16.5,15.5H14V17h2a.5.5,0,0,1,.5.5v1a.5.5,0,0,1-.5.5H14v.5H8V19H6a.5.5,0,0,1-.5-.5v-1A.5.5,0,0,1,6,17H7.5V15.5H6V11.5H7.5V10H6V8.5A.5.5,0,0,1,6.5,8H8V6.5h1.5V5h1.5V6.5h1.5V5h1.5V6.5H16a.5.5,0,0,1,.5.5V8.5H18v1.5H16.5Zm0-4H18V10H16.5Zm-9-1.5H8V8.5h.5ZM8,15.5v-4h.5v4Zm7.5-4v4H16v-4Z"/>
  </svg>
);

export default DumbbellIcon;

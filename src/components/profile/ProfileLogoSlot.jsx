import '@/styles/profilePosition.css';

// Keep the old control's flow footprint so headings/cards do not move. The
// existing link/menu remains a descendant of its page (including hidden tabs).
export default function ProfileLogoSlot({ children }) {
  return <div className="h-11 w-11 shrink-0" data-profile-logo-slot>
    <div className="shinka-profile-logo">{children}</div>
  </div>;
}

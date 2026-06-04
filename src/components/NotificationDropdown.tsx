import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, ShieldCheck, Mail, AlertTriangle, MessageSquare } from "lucide-react";
import { Notification } from "../types";

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkRead: () => void;
}

export function NotificationDropdown({ notifications, onMarkRead }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} id="nav-notifications">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            onMarkRead();
          }
        }}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition focus:outline-none"
        id="btn-bell"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse"
            id="unread-badge"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 text-xs"
          id="notif-dropdown-box"
        >
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <span className="font-bold text-gray-800">System Notifications</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-black">
              {unreadCount} unread
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50" id="notif-list-container">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400 italic">
                No alerts logged in the system.
              </div>
            ) : (
              notifications.map((notif) => {
                // Determine icon based on types
                const icons = {
                  success: <ShieldCheck className="h-4 w-4 text-emerald-600" />,
                  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                  error: <Trash2 className="h-4 w-4 text-red-500" />,
                  info: <Mail className="h-4 w-4 text-blue-500" />
                };
                const activeIcon = icons[notif.type || "info"];

                return (
                  <div
                    key={notif.id}
                    className={`p-3 text-left transition-colors flex items-start space-x-2.5 ${
                      notif.read ? "bg-white" : "bg-blue-50/40"
                    }`}
                  >
                    <div className="mt-0.5 bg-white p-1 rounded border border-gray-100 shadow-sm">
                      {activeIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-[11px] text-gray-800 truncate">{notif.title}</h5>
                        {!notif.read && <span className="h-1.5 w-1.5 bg-blue-600 rounded-full shrink-0" />}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed break-words">
                        {notif.message}
                      </p>
                      <span className="text-[8px] text-gray-400 font-mono block mt-1">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 text-center bg-gray-50 rounded-b-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-gray-500 hover:text-gray-700 font-bold uppercase tracking-wider"
            >
              Dismiss Queue Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

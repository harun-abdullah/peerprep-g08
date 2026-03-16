import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Tooltip } from "@heroui/react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navItems = [
    { name: "Dashboard", path: "/"},
    { name: "History", path: "/history"},
    { name: "Questions", path: "/questions"},
    { name: "Profile", path: "/profile"},
  ];

  return (
    <div
      className={`flex flex-col h-screen bg-white shadow-lg transition-all duration-300 border-r border-gray-200 z-50 ${
        collapsed ? "w-20" : "w-64"
      } ${className}`}
      style={{ position: "sticky", top: 0 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-lg font-bold text-xl min-w-[32px]">
              P
            </div>
            <span className="font-bold text-lg text-gray-800 whitespace-nowrap">Peerprep</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-lg font-bold text-xl shrink-0 mx-auto">
            P
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== "/" && location.pathname.startsWith(item.path));
          
          const linkContent = (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-orange-100 text-orange-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              } ${collapsed ? "justify-center" : "justify-start"}`}
            >
              {collapsed ? (
                <span className="font-bold text-lg">{item.name.charAt(0)}</span>
              ) : (
                <span>{item.name}</span>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.name} content={item.name} placement="right">
                {linkContent}
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 flex justify-center">
        <Button
          isIconOnly
          variant="light"
          onPress={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-gray-500"
        >
          {collapsed ? ">" : "<"}
        </Button>
      </div>
    </div>
  );
}

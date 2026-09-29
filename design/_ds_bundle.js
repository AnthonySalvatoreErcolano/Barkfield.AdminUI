/* @ds-bundle: {"format":4,"namespace":"BarkfieldRoadDesignSystem_ed681c","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"ICONS","sourcePath":"components/core/iconData.js"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"Pagination","sourcePath":"components/data/Pagination.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Chip","sourcePath":"components/display/Chip.jsx"},{"name":"StatCard","sourcePath":"components/display/StatCard.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"SidebarNav","sourcePath":"components/navigation/SidebarNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Dialog","sourcePath":"components/overlays/Dialog.jsx"},{"name":"DropdownMenu","sourcePath":"components/overlays/DropdownMenu.jsx"}],"sourceHashes":{"components/core/Button.jsx":"3ea9c76dee16","components/core/Icon.jsx":"259f7a67b4c8","components/core/IconButton.jsx":"a6419f595688","components/core/iconData.js":"5f3d550578bb","components/core/useStyles.js":"d8879213ce1a","components/data/DataTable.jsx":"76fce918e833","components/data/Pagination.jsx":"8c3d93f082a9","components/display/Badge.jsx":"1b749312508e","components/display/Card.jsx":"cd25659bb10e","components/display/Chip.jsx":"3d38f94cdc42","components/display/StatCard.jsx":"62a558e5df75","components/feedback/Alert.jsx":"6b8d75b71684","components/feedback/Toast.jsx":"648eacec1565","components/feedback/Tooltip.jsx":"eed3d3c6e9f1","components/forms/Checkbox.jsx":"fb4af65f81bb","components/forms/Input.jsx":"727f036f00be","components/forms/Radio.jsx":"d1f9cc52021b","components/forms/Select.jsx":"48c94b180861","components/forms/Switch.jsx":"a3a3d5559b58","components/forms/Textarea.jsx":"55e27f5a342f","components/navigation/Breadcrumbs.jsx":"6767c75bab04","components/navigation/SidebarNav.jsx":"6e49b39962dd","components/navigation/Tabs.jsx":"5b67f2939224","components/overlays/Dialog.jsx":"729a88e088e9","components/overlays/DropdownMenu.jsx":"f0d0ea425f40","ui_kits/autoship-admin/CustomerDetail.jsx":"cd3d5d5d0bb0","ui_kits/autoship-admin/Dashboard.jsx":"406392b5ffd4","ui_kits/autoship-admin/Schedule.jsx":"d8c7fbf3eb09","ui_kits/autoship-admin/Shell.jsx":"93347b3ab030","ui_kits/autoship-admin/Subscriptions.jsx":"46723bdcb7db","ui_kits/autoship-admin/data.js":"869d2531e91c"},"inlinedExternals":[],"unexposedExports":[{"name":"injectStyles","sourcePath":"components/core/useStyles.js"}]} */

(() => {

const __ds_ns = (window.BarkfieldRoadDesignSystem_ed681c = window.BarkfieldRoadDesignSystem_ed681c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/iconData.js
try { (() => {
// Lucide icon paths (lucide-static@0.460.0, ISC license). Generated — do not hand-edit.
const ICONS = {
  "layout-dashboard": "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\" /><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" />",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /><circle cx=\"9\" cy=\"7\" r=\"4\" /><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /><path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />",
  "calendar": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" />",
  "calendar-days": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" /><path d=\"M8 14h.01\" /><path d=\"M12 14h.01\" /><path d=\"M16 14h.01\" /><path d=\"M8 18h.01\" /><path d=\"M12 18h.01\" /><path d=\"M16 18h.01\" />",
  "calendar-clock": "<path d=\"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5\" /><path d=\"M16 2v4\" /><path d=\"M8 2v4\" /><path d=\"M3 10h5\" /><path d=\"M17.5 17.5 16 16.3V14\" /><circle cx=\"16\" cy=\"16\" r=\"6\" />",
  "truck": "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" /><path d=\"M15 18H9\" /><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\" /><circle cx=\"17\" cy=\"18\" r=\"2\" /><circle cx=\"7\" cy=\"18\" r=\"2\" />",
  "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\" /><path d=\"M12 22V12\" /><path d=\"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7\" /><path d=\"m7.5 4.27 9 5.15\" />",
  "repeat": "<path d=\"m17 2 4 4-4 4\" /><path d=\"M3 11v-1a4 4 0 0 1 4-4h14\" /><path d=\"m7 22-4-4 4-4\" /><path d=\"M21 13v1a4 4 0 0 1-4 4H3\" />",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /><path d=\"m21 21-4.3-4.3\" />",
  "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />",
  "plus": "<path d=\"M5 12h14\" /><path d=\"M12 5v14\" />",
  "minus": "<path d=\"M5 12h14\" />",
  "filter": "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "chevron-up": "<path d=\"m18 15-6-6-6 6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "pause": "<rect x=\"14\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\" /><rect x=\"6\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\" />",
  "play": "<polygon points=\"6 3 20 12 6 21 6 3\" />",
  "skip-forward": "<polygon points=\"5 4 15 12 5 20 5 4\" /><line x1=\"19\" x2=\"19\" y1=\"5\" y2=\"19\" />",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /><path d=\"m15 5 4 4\" />",
  "trash-2": "<path d=\"M3 6h18\" /><path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /><path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /><line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /><line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />",
  "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\" /><circle cx=\"19\" cy=\"12\" r=\"1\" /><circle cx=\"5\" cy=\"12\" r=\"1\" />",
  "mail": "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" /><path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\" />",
  "phone": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\" />",
  "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" /><circle cx=\"12\" cy=\"10\" r=\"3\" />",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /><path d=\"M2 12h20\" />",
  "credit-card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\" /><line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\" />",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /><path d=\"M12 9v4\" /><path d=\"M12 17h.01\" />",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 16v-4\" /><path d=\"M12 8h.01\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"m9 12 2 2 4-4\" />",
  "circle-x": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"m15 9-6 6\" /><path d=\"m9 9 6 6\" />",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><polyline points=\"7 10 12 15 17 10\" /><line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  "upload": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><polyline points=\"17 8 12 3 7 8\" /><line x1=\"12\" x2=\"12\" y1=\"3\" y2=\"15\" />",
  "trending-up": "<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\" /><polyline points=\"16 7 22 7 22 13\" />",
  "trending-down": "<polyline points=\"22 17 13.5 8.5 8.5 13.5 2 7\" /><polyline points=\"16 17 22 17 22 11\" />",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><polyline points=\"12 6 12 12 16 14\" />",
  "dog": "<path d=\"M11.25 16.25h1.5L12 17z\" /><path d=\"M16 14v.5\" /><path d=\"M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309\" /><path d=\"M8 14v.5\" /><path d=\"M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5\" />",
  "bone": "<path d=\"M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z\" />",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /><polyline points=\"16 17 21 12 16 7\" /><line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /><line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /><line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /><line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /><line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /><line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /><line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /><line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /><line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /><path d=\"M21 3v5h-5\" /><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /><path d=\"M8 16H3v5\" />",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /><path d=\"M10 9H8\" /><path d=\"M16 13H8\" /><path d=\"M16 17H8\" />",
  "message-square": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" />",
  "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\" />",
  "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\" />",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /><circle cx=\"12\" cy=\"7\" r=\"4\" />",
  "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />",
  "shopping-bag": "<path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z\" /><path d=\"M3 6h18\" /><path d=\"M16 10a4 4 0 0 1-8 0\" />",
  "circle-dollar-sign": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\" /><path d=\"M12 18V6\" />",
  "route": "<circle cx=\"6\" cy=\"19\" r=\"3\" /><path d=\"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15\" /><circle cx=\"18\" cy=\"5\" r=\"3\" />",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\" /><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\" />",
  "external-link": "<path d=\"M15 3h6v6\" /><path d=\"M10 14 21 3\" /><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  "arrow-up-down": "<path d=\"m21 16-4 4-4-4\" /><path d=\"M17 20V4\" /><path d=\"m3 8 4-4 4 4\" /><path d=\"M7 4v16\" />",
  "arrow-up": "<path d=\"m5 12 7-7 7 7\" /><path d=\"M12 19V5\" />",
  "arrow-down": "<path d=\"M12 5v14\" /><path d=\"m19 12-7 7-7-7\" />",
  "list": "<path d=\"M3 12h.01\" /><path d=\"M3 18h.01\" /><path d=\"M3 6h.01\" /><path d=\"M8 12h13\" /><path d=\"M8 18h13\" /><path d=\"M8 6h13\" />",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  "store": "<path d=\"m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7\" /><path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\" /><path d=\"M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4\" /><path d=\"M2 7h20\" /><path d=\"M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7\" />",
  "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\" /><circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />",
  "notebook-pen": "<path d=\"M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4\" /><path d=\"M2 6h4\" /><path d=\"M2 10h4\" /><path d=\"M2 14h4\" /><path d=\"M2 18h4\" /><path d=\"M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z\" />",
  "printer": "<path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\" /><path d=\"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6\" /><rect x=\"6\" y=\"14\" width=\"12\" height=\"8\" rx=\"1\" />",
  "cake": "<path d=\"M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8\" /><path d=\"M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1\" /><path d=\"M2 21h20\" /><path d=\"M7 8v3\" /><path d=\"M12 8v3\" /><path d=\"M17 8v3\" /><path d=\"M7 4h.01\" /><path d=\"M12 4h.01\" /><path d=\"M17 4h.01\" />"
};
Object.assign(__ds_scope, { ICONS });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/iconData.js", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
  className,
  title
}) {
  const body = __ds_scope.ICONS[name];
  if (!body) return null;
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    role: title ? 'img' : undefined,
    'aria-hidden': title ? undefined : true,
    'aria-label': title,
    style: Object.assign({
      flexShrink: 0,
      display: 'block'
    }, style),
    dangerouslySetInnerHTML: {
      __html: body
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/useStyles.js
try { (() => {
// Injects a component's stylesheet once per document. Keeps components self-contained (no CSS-in-JS deps).
const done = {};
function injectStyles(id, css) {
  if (typeof document === 'undefined' || done[id] || document.getElementById('br-css-' + id)) {
    done[id] = true;
    return;
  }
  const el = document.createElement('style');
  el.id = 'br-css-' + id;
  el.textContent = css;
  document.head.appendChild(el);
  done[id] = true;
}
Object.assign(__ds_scope, { injectStyles });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/useStyles.js", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:var(--radius-sm);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:var(--tracking-label);cursor:pointer;white-space:nowrap;transition:background var(--duration-fast) var(--ease-out),border-color var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out),transform var(--duration-fast) var(--ease-out);text-decoration:none;line-height:1}', '.br-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}', '.br-btn:active:not(:disabled){transform:translateY(1px)}', '.br-btn:disabled{cursor:not-allowed;opacity:.45}', '.br-btn--sm{height:var(--control-h-sm);padding:0 12px;font-size:11.5px}', '.br-btn--md{height:var(--control-h-md);padding:0 16px;font-size:12.5px}', '.br-btn--lg{height:var(--control-h-lg);padding:0 22px;font-size:14px}', '.br-btn--full{width:100%}', '.br-btn--primary{background:var(--action-primary);color:var(--text-on-brand)}', '.br-btn--primary:hover:not(:disabled){background:var(--action-primary-hover)}', '.br-btn--primary:active:not(:disabled){background:var(--action-primary-press)}', '.br-btn--accent{background:var(--action-accent);color:var(--white)}', '.br-btn--accent:hover:not(:disabled){background:var(--action-accent-hover)}', '.br-btn--accent:active:not(:disabled){background:var(--action-accent-press)}', '.br-btn--secondary{background:var(--surface-card);color:var(--text-brand);border-color:var(--border-strong)}', '.br-btn--secondary:hover:not(:disabled){background:var(--surface-hover);border-color:var(--teal-300)}', '.br-btn--ghost{background:transparent;color:var(--text-brand)}', '.br-btn--ghost:hover:not(:disabled){background:var(--teal-50)}', '.br-btn--danger{background:var(--surface-card);color:var(--status-danger-fg);border-color:var(--terracotta-200)}', '.br-btn--danger:hover:not(:disabled){background:var(--status-danger-bg);border-color:var(--terracotta-400)}', '.br-btn--cream{background:var(--cream-300);color:var(--teal-700)}', '.br-btn--cream:hover:not(:disabled){background:var(--cream-400)}'].join('');
function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  disabled,
  type = 'button',
  children,
  className,
  ...rest
}) {
  __ds_scope.injectStyles('button', CSS);
  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 14 : 16;
  const cls = ['br-btn', 'br-btn--' + variant, 'br-btn--' + size, fullWidth ? 'br-btn--full' : '', className || ''].join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled
  }, rest), iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: iconSize,
    strokeWidth: 2
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: iconSize,
    strokeWidth: 2
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-ibtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:var(--radius-sm);cursor:pointer;padding:0;transition:background var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out);color:var(--text-secondary);background:transparent}', '.br-ibtn:focus-visible{outline:none;box-shadow:var(--focus-ring)}', '.br-ibtn:disabled{opacity:.4;cursor:not-allowed}', '.br-ibtn--ghost:hover:not(:disabled){background:var(--surface-hover);color:var(--text-brand)}', '.br-ibtn--secondary{background:var(--surface-card);border-color:var(--border-default);color:var(--text-brand)}', '.br-ibtn--secondary:hover:not(:disabled){border-color:var(--teal-300);background:var(--surface-hover)}', '.br-ibtn--primary{background:var(--action-primary);color:var(--text-on-brand)}', '.br-ibtn--primary:hover:not(:disabled){background:var(--action-primary-hover)}', '.br-ibtn--on-brand{color:var(--text-on-brand)}', '.br-ibtn--on-brand:hover:not(:disabled){background:rgba(242,218,178,.14)}', '.br-ibtn--sm{width:28px;height:28px}.br-ibtn--md{width:36px;height:36px}.br-ibtn--lg{width:44px;height:44px}'].join('');
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className,
  ...rest
}) {
  __ds_scope.injectStyles('iconbutton', CSS);
  const s = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    className: ['br-ibtn', 'br-ibtn--' + variant, 'br-ibtn--' + size, className || ''].join(' ')
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/Pagination.jsx
try { (() => {
const CSS = ['.br-pag{display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:var(--font-body);font-size:14px;color:var(--text-muted);padding:12px 20px}', '.br-pag__pages{display:flex;align-items:center;gap:4px}', '.br-pag__n{min-width:30px;height:30px;padding:0 6px;border-radius:var(--radius-sm);border:1px solid transparent;background:transparent;font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--text-secondary);cursor:pointer;padding-top:2px}', '.br-pag__n:hover{background:var(--surface-hover);color:var(--text-brand)}', '.br-pag__n--on{background:var(--teal-500);color:var(--cream-300)}', '.br-pag__n--on:hover{background:var(--teal-600);color:var(--cream-300)}', '.br-pag__gap{padding:0 4px}'].join('');
function range(page, count) {
  if (count <= 7) return Array.from({
    length: count
  }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', count];
  if (page >= count - 3) return [1, '…', count - 4, count - 3, count - 2, count - 1, count];
  return [1, '…', page - 1, page, page + 1, '…', count];
}
function Pagination({
  page,
  pageCount,
  onChange,
  total,
  pageSize,
  style
}) {
  __ds_scope.injectStyles('pagination', CSS);
  const from = total ? (page - 1) * pageSize + 1 : null;
  const to = total ? Math.min(total, page * pageSize) : null;
  return /*#__PURE__*/React.createElement("nav", {
    className: "br-pag",
    style: style,
    "aria-label": "Pagination"
  }, /*#__PURE__*/React.createElement("span", null, total ? 'Showing ' + from + '–' + to + ' of ' + total.toLocaleString() : 'Page ' + page + ' of ' + pageCount), /*#__PURE__*/React.createElement("div", {
    className: "br-pag__pages"
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-left",
    label: "Previous page",
    size: "sm",
    disabled: page <= 1,
    onClick: () => onChange(page - 1)
  }), range(page, pageCount).map((n, i) => n === '…' ? /*#__PURE__*/React.createElement("span", {
    key: 'g' + i,
    className: "br-pag__gap"
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: 'br-pag__n' + (n === page ? ' br-pag__n--on' : ''),
    "aria-current": n === page ? 'page' : undefined,
    onClick: () => onChange(n)
  }, n)), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-right",
    label: "Next page",
    size: "sm",
    disabled: page >= pageCount,
    onClick: () => onChange(page + 1)
  })));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
const CSS = ['.br-badge{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;border-radius:var(--radius-pill);font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:var(--tracking-label);text-transform:uppercase;white-space:nowrap;line-height:1;padding-top:1px}', '.br-badge__dot{width:6px;height:6px;border-radius:50%;background:currentColor;margin-top:-1px}', '.br-badge--success{background:var(--status-success-bg);color:var(--status-success-fg)}', '.br-badge--warning{background:var(--status-warning-bg);color:var(--status-warning-fg)}', '.br-badge--danger{background:var(--status-danger-bg);color:var(--status-danger-fg)}', '.br-badge--info{background:var(--status-info-bg);color:var(--status-info-fg)}', '.br-badge--neutral{background:var(--status-neutral-bg);color:var(--status-neutral-fg)}', '.br-badge--brand{background:var(--cream-300);color:var(--teal-700)}', '.br-badge--solid.br-badge--success{background:var(--status-success-solid);color:#fff}', '.br-badge--solid.br-badge--warning{background:var(--status-warning-solid);color:#fff}', '.br-badge--solid.br-badge--danger{background:var(--status-danger-solid);color:#fff}', '.br-badge--solid.br-badge--info{background:var(--status-info-solid);color:var(--cream-300)}', '.br-badge--solid.br-badge--neutral{background:var(--ink-600);color:#fff}', '.br-badge--solid.br-badge--brand{background:var(--teal-500);color:var(--cream-300)}'].join('');
function Badge({
  tone = 'neutral',
  variant = 'soft',
  dot,
  children,
  style
}) {
  __ds_scope.injectStyles('badge', CSS);
  return /*#__PURE__*/React.createElement("span", {
    className: ['br-badge', 'br-badge--' + tone, variant === 'solid' ? 'br-badge--solid' : ''].join(' '),
    style: style
  }, dot ? /*#__PURE__*/React.createElement("span", {
    className: "br-badge__dot"
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
const CSS = ['.br-card{background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-xs);display:flex;flex-direction:column;min-width:0}', '.br-card--cream{background:var(--cream-100);border-color:var(--cream-400)}', '.br-card--brand{background:var(--teal-500);border-color:var(--teal-500);color:var(--cream-300)}', '.br-card__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 20px 0}', '.br-card__eyebrow{font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--tan-700);margin-bottom:4px}', '.br-card--brand .br-card__eyebrow{color:var(--tan-300)}', '.br-card__title{font-family:var(--font-display);font-weight:800;font-size:16px;letter-spacing:.02em;text-transform:uppercase;color:var(--text-primary);line-height:1.2}', '.br-card--brand .br-card__title{color:var(--cream-300)}', '.br-card__actions{display:flex;align-items:center;gap:8px;flex-shrink:0}', '.br-card__body{padding:16px 20px 20px;flex:1;min-width:0}', '.br-card__body--flush{padding:12px 0 0}', '.br-card__foot{padding:12px 20px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;gap:8px;justify-content:flex-end}'].join('');
function Card({
  title,
  eyebrow,
  actions,
  footer,
  children,
  tone = 'default',
  flush,
  style
}) {
  __ds_scope.injectStyles('card', CSS);
  const hasHead = title || eyebrow || actions;
  return /*#__PURE__*/React.createElement("section", {
    className: 'br-card' + (tone !== 'default' ? ' br-card--' + tone : ''),
    style: style
  }, hasHead ? /*#__PURE__*/React.createElement("header", {
    className: "br-card__head"
  }, /*#__PURE__*/React.createElement("div", null, eyebrow ? /*#__PURE__*/React.createElement("div", {
    className: "br-card__eyebrow"
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("h3", {
    className: "br-card__title"
  }, title) : null), actions ? /*#__PURE__*/React.createElement("div", {
    className: "br-card__actions"
  }, actions) : null) : null, /*#__PURE__*/React.createElement("div", {
    className: 'br-card__body' + (flush ? ' br-card__body--flush' : ''),
    style: hasHead ? null : {
      paddingTop: 20
    }
  }, children), footer ? /*#__PURE__*/React.createElement("footer", {
    className: "br-card__foot"
  }, footer) : null);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Chip.jsx
try { (() => {
const CSS = ['.br-chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:var(--radius-pill);border:1px solid var(--border-strong);background:var(--surface-card);color:var(--text-primary);font-family:var(--font-display);font-weight:600;font-size:13.5px;line-height:1;white-space:nowrap;transition:all var(--duration-fast) var(--ease-out);padding-top:1px}', 'button.br-chip{cursor:pointer}', 'button.br-chip:hover{border-color:var(--teal-300);background:var(--surface-hover)}', '.br-chip:focus-visible{outline:none;box-shadow:var(--focus-ring)}', '.br-chip--sm{height:24px;padding:0 9px;font-size:12.5px}', '.br-chip--selected{background:var(--teal-500);border-color:var(--teal-500);color:var(--cream-300)}', 'button.br-chip--selected:hover{background:var(--teal-600);border-color:var(--teal-600)}', '.br-chip--tag{background:var(--cream-100);border-color:var(--cream-400);color:var(--tan-800)}', '.br-chip__count{font-size:11.5px;font-weight:700;padding:2px 6px 1px;border-radius:var(--radius-pill);background:var(--ink-100);color:var(--text-secondary)}', '.br-chip--selected .br-chip__count{background:rgba(242,218,178,.22);color:var(--cream-300)}', '.br-chip__x{display:inline-flex;border:0;background:transparent;padding:2px;margin-right:-6px;border-radius:50%;cursor:pointer;color:inherit;opacity:.7}', '.br-chip__x:hover{opacity:1;background:rgba(0,0,0,.06)}'].join('');
function Chip({
  children,
  selected,
  onClick,
  onRemove,
  icon,
  count,
  variant = 'filter',
  size = 'md',
  style
}) {
  __ds_scope.injectStyles('chip', CSS);
  const cls = ['br-chip', selected ? 'br-chip--selected' : '', variant === 'tag' ? 'br-chip--tag' : '', size === 'sm' ? 'br-chip--sm' : ''].join(' ');
  const inner = [icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    key: "i",
    name: icon,
    size: 14
  }) : null, /*#__PURE__*/React.createElement("span", {
    key: "l"
  }, children), count != null ? /*#__PURE__*/React.createElement("span", {
    key: "c",
    className: "br-chip__count"
  }, count) : null, onRemove ? /*#__PURE__*/React.createElement("span", {
    key: "x",
    role: "button",
    "aria-label": "Remove",
    className: "br-chip__x",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 13,
    strokeWidth: 2.25
  })) : null];
  return onClick ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cls,
    "aria-pressed": !!selected,
    onClick: onClick,
    style: style
  }, inner) : /*#__PURE__*/React.createElement("span", {
    className: cls,
    style: style
  }, inner);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Chip.jsx", error: String((e && e.message) || e) }); }

// components/display/StatCard.jsx
try { (() => {
const CSS = ['.br-stat{background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-xs);padding:18px 20px;display:flex;flex-direction:column;gap:10px;min-width:0}', '.br-stat__top{display:flex;align-items:center;justify-content:space-between;gap:8px}', '.br-stat__label{font-family:var(--font-display);font-weight:700;font-size:11.5px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}', '.br-stat__icon{width:32px;height:32px;border-radius:50%;background:var(--cream-200);color:var(--teal-600);display:flex;align-items:center;justify-content:center}', '.br-stat__value{font-family:var(--font-display);font-weight:900;font-size:32px;line-height:1;letter-spacing:var(--tracking-display);color:var(--teal-500);font-variant-numeric:tabular-nums}', '.br-stat__foot{display:flex;align-items:center;gap:8px;font-family:var(--font-body);font-size:13.5px;color:var(--text-muted)}', '.br-stat__delta{display:inline-flex;align-items:center;gap:3px;font-family:var(--font-display);font-weight:700;font-size:12.5px}', '.br-stat__delta--up{color:var(--status-success-fg)}.br-stat__delta--down{color:var(--status-danger-fg)}'].join('');
function StatCard({
  label,
  value,
  delta,
  trend,
  caption,
  icon,
  style
}) {
  __ds_scope.injectStyles('statcard', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: "br-stat",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "br-stat__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "br-stat__label"
  }, label), icon ? /*#__PURE__*/React.createElement("span", {
    className: "br-stat__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  })) : null), /*#__PURE__*/React.createElement("div", {
    className: "br-stat__value"
  }, value), delta || caption ? /*#__PURE__*/React.createElement("div", {
    className: "br-stat__foot"
  }, delta ? /*#__PURE__*/React.createElement("span", {
    className: 'br-stat__delta br-stat__delta--' + (trend || 'up')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trend === 'down' ? 'trending-down' : 'trending-up',
    size: 14,
    strokeWidth: 2
  }), delta) : null, caption ? /*#__PURE__*/React.createElement("span", null, caption) : null) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
const ICON = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-x'
};
const CSS = ['.br-alert{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:var(--radius-md);border:1px solid;font-family:var(--font-body);font-size:14.5px;line-height:1.45}', '.br-alert--info{background:var(--status-info-bg);border-color:var(--teal-100);color:var(--status-info-fg)}', '.br-alert--success{background:var(--status-success-bg);border-color:var(--green-100);color:var(--status-success-fg)}', '.br-alert--warning{background:var(--status-warning-bg);border-color:var(--amber-100);color:var(--status-warning-fg)}', '.br-alert--danger{background:var(--status-danger-bg);border-color:var(--terracotta-100);color:var(--status-danger-fg)}', '.br-alert__body{flex:1;min-width:0;color:var(--text-primary)}', '.br-alert__title{font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:.01em;margin-bottom:2px;padding-top:2px}', '.br-alert__x{border:0;background:transparent;color:inherit;cursor:pointer;padding:2px;border-radius:var(--radius-xs);opacity:.7}', '.br-alert__x:hover{opacity:1}', '.br-alert__action{flex-shrink:0;align-self:center}'].join('');
function Alert({
  tone = 'info',
  title,
  children,
  action,
  onClose,
  style
}) {
  __ds_scope.injectStyles('alert', CSS);
  return /*#__PURE__*/React.createElement("div", {
    role: tone === 'danger' ? 'alert' : 'status',
    className: 'br-alert br-alert--' + tone,
    style: style
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICON[tone],
    size: 18,
    style: {
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "br-alert__body"
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "br-alert__title",
    style: {
      color: 'inherit'
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", null, children)), action ? /*#__PURE__*/React.createElement("div", {
    className: "br-alert__action"
  }, action) : null, onClose ? /*#__PURE__*/React.createElement("button", {
    className: "br-alert__x",
    "aria-label": "Dismiss",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const ICON = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-x'
};
const COLOR = {
  info: 'var(--teal-300)',
  success: '#7FC39A',
  warning: 'var(--amber-500)',
  danger: 'var(--terracotta-300)'
};
const CSS = ['.br-toast{display:flex;align-items:flex-start;gap:12px;width:360px;max-width:calc(100vw - 32px);padding:14px 14px 14px 16px;border-radius:var(--radius-md);background:var(--ink-900);color:var(--cream-100);box-shadow:var(--shadow-lg);font-family:var(--font-body);font-size:14px;line-height:1.4;animation:br-toast-in var(--duration-slow) var(--ease-out)}', '@keyframes br-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}', '.br-toast__body{flex:1;min-width:0}', '.br-toast__title{font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:.01em;color:var(--cream-300);padding-top:2px}', '.br-toast__msg{color:var(--ink-300);margin-top:2px}', '.br-toast__action{border:0;background:transparent;font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--cream-300);cursor:pointer;padding:4px 6px;border-radius:var(--radius-xs);align-self:center}', '.br-toast__action:hover{background:rgba(242,218,178,.12)}', '.br-toast__x{border:0;background:transparent;color:var(--ink-400);cursor:pointer;padding:2px}', '.br-toast__x:hover{color:var(--cream-100)}', '.br-toast-stack{position:fixed;right:24px;bottom:24px;display:flex;flex-direction:column;gap:10px;z-index:var(--z-toast)}'].join('');
function Toast({
  tone = 'success',
  title,
  message,
  actionLabel,
  onAction,
  onClose,
  style
}) {
  __ds_scope.injectStyles('toast', CSS);
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "br-toast",
    style: style
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICON[tone],
    size: 18,
    color: COLOR[tone],
    style: {
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "br-toast__body"
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "br-toast__title"
  }, title) : null, message ? /*#__PURE__*/React.createElement("div", {
    className: "br-toast__msg"
  }, message) : null), actionLabel ? /*#__PURE__*/React.createElement("button", {
    className: "br-toast__action",
    onClick: onAction
  }, actionLabel) : null, onClose ? /*#__PURE__*/React.createElement("button", {
    className: "br-toast__x",
    "aria-label": "Dismiss",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const CSS = ['.br-tip{position:relative;display:inline-flex}', '.br-tip__bubble{position:absolute;left:50%;transform:translateX(-50%) translateY(4px);z-index:var(--z-dropdown);background:var(--ink-900);color:var(--cream-100);font-family:var(--font-body);font-size:13px;line-height:1.35;padding:6px 10px;border-radius:var(--radius-sm);white-space:nowrap;box-shadow:var(--shadow-md);opacity:0;pointer-events:none;transition:opacity var(--duration-fast) var(--ease-out),transform var(--duration-fast) var(--ease-out)}', '.br-tip__bubble--top{bottom:calc(100% + 8px)}', '.br-tip__bubble--bottom{top:calc(100% + 8px);transform:translateX(-50%) translateY(-4px)}', '.br-tip__bubble::after{content:"";position:absolute;left:50%;margin-left:-5px;border:5px solid transparent}', '.br-tip__bubble--top::after{top:100%;border-top-color:var(--ink-900)}', '.br-tip__bubble--bottom::after{bottom:100%;border-bottom-color:var(--ink-900)}', '.br-tip:hover .br-tip__bubble,.br-tip:focus-within .br-tip__bubble,.br-tip--open .br-tip__bubble{opacity:1;transform:translateX(-50%) translateY(0)}'].join('');
function Tooltip({
  content,
  placement = 'top',
  open,
  children,
  style
}) {
  __ds_scope.injectStyles('tooltip', CSS);
  return /*#__PURE__*/React.createElement("span", {
    className: 'br-tip' + (open ? ' br-tip--open' : ''),
    style: style
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    className: 'br-tip__bubble br-tip__bubble--' + placement
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-check{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary);line-height:1.35}', '.br-check--disabled{opacity:.5;cursor:not-allowed}', '.br-check input{position:absolute;opacity:0;width:0;height:0}', '.br-check__box{flex-shrink:0;width:18px;height:18px;margin-top:1px;border:1.5px solid var(--border-strong);border-radius:var(--radius-xs);background:var(--surface-card);display:flex;align-items:center;justify-content:center;color:var(--text-on-brand);transition:all var(--duration-fast) var(--ease-out)}', '.br-check:hover .br-check__box{border-color:var(--teal-400)}', '.br-check input:focus-visible + .br-check__box{box-shadow:var(--focus-ring)}', '.br-check--on .br-check__box{background:var(--action-primary);border-color:var(--action-primary)}', '.br-check__desc{display:block;font-size:13px;color:var(--text-muted)}'].join('');
function Checkbox({
  label,
  description,
  checked,
  indeterminate,
  onChange,
  disabled,
  style,
  ...rest
}) {
  __ds_scope.injectStyles('checkbox', CSS);
  const on = checked || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    className: ['br-check', on ? 'br-check--on' : '', disabled ? 'br-check--disabled' : ''].join(' '),
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked, e)
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "br-check__box"
  }, indeterminate ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 13,
    strokeWidth: 3
  }) : checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 3
  }) : null), label || description ? /*#__PURE__*/React.createElement("span", null, label, description ? /*#__PURE__*/React.createElement("span", {
    className: "br-check__desc"
  }, description) : null) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
const CSS = ['.br-table-wrap{width:100%;overflow-x:auto}', '.br-table{width:100%;border-collapse:separate;border-spacing:0;font-family:var(--font-body);font-size:14.5px;color:var(--text-primary)}', '.br-table th{position:sticky;top:0;background:var(--surface-sunken);text-align:left;font-family:var(--font-display);font-weight:700;font-size:11.5px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--tan-700);padding:0 14px;height:38px;border-bottom:1px solid var(--border-default);white-space:nowrap;padding-top:1px}', '.br-table th:first-child,.br-table td:first-child{padding-left:20px}', '.br-table th:last-child,.br-table td:last-child{padding-right:20px}', '.br-table th.br-sortable{cursor:pointer;user-select:none}', '.br-table th.br-sortable:hover{color:var(--teal-600)}', '.br-table th .br-th{display:inline-flex;align-items:center;gap:4px}', '.br-table td{padding:0 14px;height:52px;border-bottom:1px solid var(--border-subtle);vertical-align:middle;font-variant-numeric:tabular-nums}', '.br-table--compact td{height:40px;font-size:14px}', '.br-table tbody tr{transition:background var(--duration-fast) var(--ease-out)}', '.br-table tbody tr:hover td{background:var(--surface-hover)}', '.br-table tbody tr.br-clickable{cursor:pointer}', '.br-table tbody tr.br-selected td{background:var(--surface-selected)}', '.br-table tbody tr:last-child td{border-bottom:0}', '.br-table .br-sel{width:44px;padding-right:0}', '.br-table__empty{padding:40px 20px;text-align:center;color:var(--text-muted);font-family:var(--font-body)}'].join('');
function DataTable({
  columns,
  rows,
  rowKey = 'id',
  selectable,
  selected = [],
  onSelectChange,
  onRowClick,
  sort,
  onSortChange,
  density = 'default',
  empty = 'Nothing here yet.',
  style
}) {
  __ds_scope.injectStyles('datatable', CSS);
  const keys = rows.map(r => r[rowKey]);
  const allOn = selectable && keys.length > 0 && keys.every(k => selected.includes(k));
  const someOn = selectable && !allOn && keys.some(k => selected.includes(k));
  const toggleAll = () => onSelectChange && onSelectChange(allOn ? [] : keys);
  const toggle = k => onSelectChange && onSelectChange(selected.includes(k) ? selected.filter(x => x !== k) : selected.concat([k]));
  const clickSort = col => {
    if (!col.sortable || !onSortChange) return;
    const dir = sort && sort.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({
      key: col.key,
      dir
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "br-table-wrap",
    style: style
  }, /*#__PURE__*/React.createElement("table", {
    className: 'br-table' + (density === 'compact' ? ' br-table--compact' : '')
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, selectable ? /*#__PURE__*/React.createElement("th", {
    className: "br-sel"
  }, /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
    checked: allOn,
    indeterminate: someOn,
    onChange: toggleAll,
    "aria-label": "Select all"
  })) : null, columns.map(c => {
    const active = sort && sort.key === c.key;
    return /*#__PURE__*/React.createElement("th", {
      key: c.key,
      className: c.sortable ? 'br-sortable' : '',
      style: {
        width: c.width,
        textAlign: c.align || 'left'
      },
      onClick: () => clickSort(c)
    }, /*#__PURE__*/React.createElement("span", {
      className: "br-th"
    }, c.header, c.sortable ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: active ? sort.dir === 'asc' ? 'arrow-up' : 'arrow-down' : 'arrow-up-down',
      size: 12,
      strokeWidth: 2.25,
      style: {
        opacity: active ? 1 : .45
      }
    }) : null));
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length + (selectable ? 1 : 0),
    className: "br-table__empty"
  }, empty)) : rows.map(r => {
    const k = r[rowKey];
    const on = selectable && selected.includes(k);
    return /*#__PURE__*/React.createElement("tr", {
      key: k,
      className: [onRowClick ? 'br-clickable' : '', on ? 'br-selected' : ''].join(' '),
      onClick: onRowClick ? () => onRowClick(r) : undefined
    }, selectable ? /*#__PURE__*/React.createElement("td", {
      className: "br-sel",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement(__ds_scope.Checkbox, {
      checked: on,
      onChange: () => toggle(k),
      "aria-label": "Select row"
    })) : null, columns.map(c => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      style: {
        textAlign: c.align || 'left'
      }
    }, c.render ? c.render(r) : r[c.key])));
  }))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-field{display:flex;flex-direction:column;gap:6px;min-width:0}', '.br-field__label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}', '.br-field__hint{font-family:var(--font-body);font-size:13px;color:var(--text-muted)}', '.br-field__hint--error{color:var(--status-danger-fg)}', '.br-input{display:flex;align-items:center;gap:8px;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:0 12px;color:var(--text-muted);transition:border-color var(--duration-fast) var(--ease-out),box-shadow var(--duration-fast) var(--ease-out)}', '.br-input:hover{border-color:var(--tan-500)}', '.br-input:focus-within{border-color:var(--border-focus);box-shadow:var(--focus-ring);color:var(--text-brand)}', '.br-input--error{border-color:var(--terracotta-500)}', '.br-input--disabled{background:var(--surface-sunken);opacity:.6}', '.br-input--sm{height:var(--control-h-sm)}.br-input--md{height:var(--control-h-md)}.br-input--lg{height:var(--control-h-lg)}', '.br-input input{flex:1;min-width:0;border:0;outline:0;background:transparent;font-family:var(--font-body);font-size:15px;color:var(--text-primary);height:100%;padding:0}', '.br-input input::placeholder{color:var(--text-disabled)}', '.br-input__suffix{font-family:var(--font-body);font-size:14px;color:var(--text-muted)}'].join('');
function Input({
  label,
  hint,
  error,
  iconLeft,
  suffix,
  size = 'md',
  disabled,
  id,
  style,
  ...rest
}) {
  __ds_scope.injectStyles('input', CSS);
  const inputId = id || (label ? 'in-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  const box = ['br-input', 'br-input--' + size, error ? 'br-input--error' : '', disabled ? 'br-input--disabled' : ''].join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: "br-field",
    style: style
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "br-field__label",
    htmlFor: inputId
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: box
  }, iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: 16
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    disabled: disabled,
    "aria-invalid": !!error
  }, rest)), suffix ? /*#__PURE__*/React.createElement("span", {
    className: "br-input__suffix"
  }, suffix) : null), error ? /*#__PURE__*/React.createElement("span", {
    className: "br-field__hint br-field__hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "br-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-radio{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary);line-height:1.35}', '.br-radio--disabled{opacity:.5;cursor:not-allowed}', '.br-radio input{position:absolute;opacity:0;width:0;height:0}', '.br-radio__dot{flex-shrink:0;width:18px;height:18px;margin-top:1px;border:1.5px solid var(--border-strong);border-radius:50%;background:var(--surface-card);display:flex;align-items:center;justify-content:center;transition:all var(--duration-fast) var(--ease-out)}', '.br-radio:hover .br-radio__dot{border-color:var(--teal-400)}', '.br-radio input:focus-visible + .br-radio__dot{box-shadow:var(--focus-ring)}', '.br-radio--on .br-radio__dot{border-color:var(--action-primary);border-width:5.5px}', '.br-radio__desc{display:block;font-size:13px;color:var(--text-muted)}'].join('');
function Radio({
  label,
  description,
  checked,
  onChange,
  disabled,
  name,
  value,
  style,
  ...rest
}) {
  __ds_scope.injectStyles('radio', CSS);
  return /*#__PURE__*/React.createElement("label", {
    className: ['br-radio', checked ? 'br-radio--on' : '', disabled ? 'br-radio--disabled' : ''].join(' '),
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    name: name,
    value: value,
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(value, e)
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "br-radio__dot"
  }), label || description ? /*#__PURE__*/React.createElement("span", null, label, description ? /*#__PURE__*/React.createElement("span", {
    className: "br-radio__desc"
  }, description) : null) : null);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-field{display:flex;flex-direction:column;gap:6px;min-width:0}', '.br-field__label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}', '.br-field__hint{font-family:var(--font-body);font-size:13px;color:var(--text-muted)}', '.br-field__hint--error{color:var(--status-danger-fg)}', '.br-select{position:relative;display:flex;align-items:center}', '.br-select select{appearance:none;-webkit-appearance:none;width:100%;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:0 36px 0 12px;font-family:var(--font-body);font-size:15px;color:var(--text-primary);cursor:pointer;transition:border-color var(--duration-fast) var(--ease-out)}', '.br-select select:hover{border-color:var(--tan-500)}', '.br-select select:focus{outline:0;border-color:var(--border-focus);box-shadow:var(--focus-ring)}', '.br-select select:disabled{background:var(--surface-sunken);opacity:.6;cursor:not-allowed}', '.br-select--sm select{height:var(--control-h-sm);font-size:14px}.br-select--md select{height:var(--control-h-md)}.br-select--lg select{height:var(--control-h-lg)}', '.br-select__chev{position:absolute;right:10px;pointer-events:none;color:var(--text-brand)}'].join('');
function Select({
  label,
  hint,
  options = [],
  size = 'md',
  id,
  style,
  ...rest
}) {
  __ds_scope.injectStyles('select', CSS);
  const selId = id || (label ? 'sel-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: "br-field",
    style: style
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "br-field__label",
    htmlFor: selId
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: 'br-select br-select--' + size
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selId
  }, rest), options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value,
    disabled: o.disabled
  }, o.label))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    className: "br-select__chev"
  })), hint ? /*#__PURE__*/React.createElement("span", {
    className: "br-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary)}', '.br-switch--disabled{opacity:.5;cursor:not-allowed}', '.br-switch input{position:absolute;opacity:0;width:0;height:0}', '.br-switch__track{position:relative;width:36px;height:20px;border-radius:var(--radius-pill);background:var(--ink-300);transition:background var(--duration-base) var(--ease-out);flex-shrink:0}', '.br-switch__thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--white);box-shadow:var(--shadow-sm);transition:transform var(--duration-base) var(--ease-out)}', '.br-switch--on .br-switch__track{background:var(--action-primary)}', '.br-switch--on .br-switch__thumb{transform:translateX(16px);background:var(--cream-100)}', '.br-switch input:focus-visible + .br-switch__track{box-shadow:var(--focus-ring)}'].join('');
function Switch({
  label,
  checked,
  onChange,
  disabled,
  style,
  ...rest
}) {
  __ds_scope.injectStyles('switch', CSS);
  return /*#__PURE__*/React.createElement("label", {
    className: ['br-switch', checked ? 'br-switch--on' : '', disabled ? 'br-switch--disabled' : ''].join(' '),
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked, e)
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "br-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "br-switch__thumb"
  })), label ? /*#__PURE__*/React.createElement("span", null, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = ['.br-field{display:flex;flex-direction:column;gap:6px;min-width:0}', '.br-field__label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}', '.br-field__hint{font-family:var(--font-body);font-size:13px;color:var(--text-muted)}', '.br-field__hint--error{color:var(--status-danger-fg)}', '.br-textarea{width:100%;min-height:96px;resize:vertical;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:10px 12px;font-family:var(--font-body);font-size:15px;line-height:1.5;color:var(--text-primary);transition:border-color var(--duration-fast) var(--ease-out),box-shadow var(--duration-fast) var(--ease-out)}', '.br-textarea::placeholder{color:var(--text-disabled)}', '.br-textarea:hover{border-color:var(--tan-500)}', '.br-textarea:focus{outline:0;border-color:var(--border-focus);box-shadow:var(--focus-ring)}', '.br-textarea--error{border-color:var(--terracotta-500)}', '.br-textarea:disabled{background:var(--surface-sunken);opacity:.6}'].join('');
function Textarea({
  label,
  hint,
  error,
  id,
  rows = 4,
  style,
  ...rest
}) {
  __ds_scope.injectStyles('textarea', CSS);
  const taId = id || (label ? 'ta-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: "br-field",
    style: style
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "br-field__label",
    htmlFor: taId
  }, label) : null, /*#__PURE__*/React.createElement("textarea", _extends({
    id: taId,
    rows: rows,
    className: 'br-textarea' + (error ? ' br-textarea--error' : ''),
    "aria-invalid": !!error
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    className: "br-field__hint br-field__hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "br-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
const CSS = ['.br-crumbs{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--text-muted)}', '.br-crumbs a,.br-crumbs button{color:var(--text-secondary);text-decoration:none;background:none;border:0;padding:0;font:inherit;cursor:pointer}', '.br-crumbs a:hover,.br-crumbs button:hover{color:var(--text-brand);text-decoration:underline;text-underline-offset:3px}', '.br-crumbs__cur{color:var(--text-primary)}'].join('');
function Breadcrumbs({
  items,
  style
}) {
  __ds_scope.injectStyles('breadcrumbs', CSS);
  return /*#__PURE__*/React.createElement("nav", {
    className: "br-crumbs",
    "aria-label": "Breadcrumb",
    style: style
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, last ? /*#__PURE__*/React.createElement("span", {
      className: "br-crumbs__cur",
      "aria-current": "page"
    }, it.label) : it.href ? /*#__PURE__*/React.createElement("a", {
      href: it.href
    }, it.label) : /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: it.onClick
    }, it.label), !last ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 14
    }) : null);
  }));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarNav.jsx
try { (() => {
const CSS = ['.br-side{width:var(--sidebar-w);flex-shrink:0;background:var(--surface-card);border-right:1px solid var(--border-default);color:var(--text-primary);display:flex;flex-direction:column;height:100%;min-height:0}', '.br-side__brand{padding:20px 22px 16px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;border-bottom:1px solid var(--border-subtle)}', '.br-side__brand img{display:block;max-width:100%;height:auto}', '.br-side__product{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--tan-700)}', '.br-side__nav{flex:1;overflow-y:auto;padding:10px 12px 16px}', '.br-side__section{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-400);padding:16px 12px 6px}', '.br-side__item{display:flex;align-items:center;gap:12px;width:100%;height:40px;padding:0 12px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--ink-700);font-family:var(--font-display);font-weight:600;font-size:14px;text-align:left;cursor:pointer;transition:background var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out)}', '.br-side__item svg{color:var(--ink-500)}', '.br-side__item:hover{background:var(--surface-hover);color:var(--teal-600)}', '.br-side__item:hover svg{color:var(--teal-500)}', '.br-side__item:focus-visible{outline:none;box-shadow:var(--focus-ring)}', '.br-side__item--on,.br-side__item--on:hover{background:var(--teal-50);color:var(--teal-600);font-weight:700}', '.br-side__item--on svg{color:var(--teal-500)}', '.br-side__label{flex:1}', '.br-side__badge{font-size:11px;font-weight:700;padding:3px 7px;border-radius:var(--radius-pill);background:var(--terracotta-500);color:#fff}', '.br-side__foot{padding:14px 18px 16px;border-top:1px solid var(--border-subtle)}'].join('');
function SidebarNav({
  sections,
  active,
  onSelect,
  logoSrc,
  logoAlt = 'Barkfield Road',
  productName,
  footer,
  style
}) {
  __ds_scope.injectStyles('sidebarnav', CSS);
  return /*#__PURE__*/React.createElement("aside", {
    className: "br-side",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "br-side__brand"
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: logoAlt
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 20,
      letterSpacing: '.01em'
    }
  }, "BARKFIELD ROAD"), productName ? /*#__PURE__*/React.createElement("span", {
    className: "br-side__product"
  }, productName) : null), /*#__PURE__*/React.createElement("nav", {
    className: "br-side__nav"
  }, sections.map((s, si) => /*#__PURE__*/React.createElement("div", {
    key: si
  }, s.title ? /*#__PURE__*/React.createElement("div", {
    className: "br-side__section"
  }, s.title) : null, s.items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    type: "button",
    className: 'br-side__item' + (active === it.id ? ' br-side__item--on' : ''),
    "aria-current": active === it.id ? 'page' : undefined,
    onClick: () => onSelect && onSelect(it.id)
  }, it.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 19
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "br-side__label"
  }, it.label), it.badge != null ? /*#__PURE__*/React.createElement("span", {
    className: "br-side__badge"
  }, it.badge) : null))))), footer ? /*#__PURE__*/React.createElement("div", {
    className: "br-side__foot"
  }, footer) : null);
}
Object.assign(__ds_scope, { SidebarNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const CSS = ['.br-tabs{display:flex;align-items:flex-end;gap:24px;border-bottom:1px solid var(--border-default)}', '.br-tab{position:relative;display:inline-flex;align-items:center;gap:8px;height:42px;border:0;background:transparent;padding:0;font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted);cursor:pointer;transition:color var(--duration-fast) var(--ease-out);padding-top:2px}', '.br-tab:hover{color:var(--text-brand)}', '.br-tab:focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-xs)}', '.br-tab--on{color:var(--teal-500)}', '.br-tab--on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;background:var(--teal-500);border-radius:2px 2px 0 0}', '.br-tab__count{font-size:11px;padding:3px 6px 2px;border-radius:var(--radius-pill);background:var(--ink-100);color:var(--text-secondary);letter-spacing:0}', '.br-tab--on .br-tab__count{background:var(--teal-50);color:var(--teal-600)}', '.br-tabs--pill{border:0;gap:4px;background:var(--surface-sunken);padding:4px;border-radius:var(--radius-md);display:inline-flex;align-items:center}', '.br-tabs--pill .br-tab{height:30px;padding:2px 12px 0;border-radius:var(--radius-sm);font-size:12px}', '.br-tabs--pill .br-tab--on{background:var(--surface-card);box-shadow:var(--shadow-sm)}', '.br-tabs--pill .br-tab--on::after{display:none}'].join('');
function Tabs({
  tabs,
  value,
  onChange,
  variant = 'line',
  style
}) {
  __ds_scope.injectStyles('tabs', CSS);
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    className: 'br-tabs' + (variant === 'pill' ? ' br-tabs--pill' : ''),
    style: style
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    role: "tab",
    type: "button",
    "aria-selected": value === t.id,
    className: 'br-tab' + (value === t.id ? ' br-tab--on' : ''),
    onClick: () => onChange && onChange(t.id)
  }, t.label, t.count != null ? /*#__PURE__*/React.createElement("span", {
    className: "br-tab__count"
  }, t.count) : null)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Dialog.jsx
try { (() => {
const CSS = ['.br-dlg-scrim{position:fixed;inset:0;background:var(--surface-overlay);display:flex;align-items:center;justify-content:center;padding:24px;z-index:var(--z-overlay);animation:br-fade var(--duration-base) var(--ease-out)}', '.br-dlg-scrim--inline{position:relative;inset:auto;min-height:100%;animation:none}', '@keyframes br-fade{from{opacity:0}to{opacity:1}}', '@keyframes br-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}', '.br-dlg{width:100%;background:var(--surface-card);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);display:flex;flex-direction:column;max-height:calc(100vh - 48px);animation:br-rise var(--duration-slow) var(--ease-out);overflow:hidden}', '.br-dlg--sm{max-width:420px}.br-dlg--md{max-width:540px}.br-dlg--lg{max-width:720px}', '.br-dlg__head{display:flex;align-items:flex-start;gap:12px;padding:22px 24px 6px}', '.br-dlg__title{flex:1;font-family:var(--font-display);font-weight:900;font-size:21px;letter-spacing:var(--tracking-display);text-transform:uppercase;color:var(--teal-500);line-height:1.15;padding-top:4px}', '.br-dlg__desc{padding:0 24px;font-family:var(--font-body);font-size:15px;color:var(--text-secondary);line-height:1.5}', '.br-dlg__body{padding:16px 24px 20px;overflow-y:auto}', '.br-dlg__foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;background:var(--surface-sunken);border-top:1px solid var(--border-subtle)}'].join('');
function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
  inline
}) {
  __ds_scope.injectStyles('dialog', CSS);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: 'br-dlg-scrim' + (inline ? ' br-dlg-scrim--inline' : ''),
    onMouseDown: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    className: 'br-dlg br-dlg--' + size
  }, /*#__PURE__*/React.createElement("div", {
    className: "br-dlg__head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "br-dlg__title"
  }, title), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Close",
    size: "sm",
    onClick: onClose
  }) : null), description ? /*#__PURE__*/React.createElement("p", {
    className: "br-dlg__desc",
    style: {
      margin: 0
    }
  }, description) : null, children ? /*#__PURE__*/React.createElement("div", {
    className: "br-dlg__body"
  }, children) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: 20
    }
  }), footer ? /*#__PURE__*/React.createElement("div", {
    className: "br-dlg__foot"
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/overlays/DropdownMenu.jsx
try { (() => {
const CSS = ['.br-dd{position:relative;display:inline-flex}', '.br-dd__menu{position:absolute;top:calc(100% + 6px);min-width:200px;background:var(--surface-raised);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-md);padding:6px;z-index:var(--z-dropdown);animation:br-dd-in var(--duration-fast) var(--ease-out)}', '@keyframes br-dd-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}', '.br-dd__menu--right{right:0}.br-dd__menu--left{left:0}', '.br-dd__label{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-400);padding:8px 10px 4px}', '.br-dd__item{display:flex;align-items:center;gap:10px;width:100%;min-height:34px;padding:0 10px;border:0;border-radius:var(--radius-sm);background:transparent;font-family:var(--font-body);font-size:14.5px;color:var(--text-primary);text-align:left;cursor:pointer;white-space:nowrap}', '.br-dd__item svg{color:var(--ink-500)}', '.br-dd__item:hover,.br-dd__item:focus-visible{outline:0;background:var(--surface-hover);color:var(--teal-600)}', '.br-dd__item:hover svg{color:var(--teal-500)}', '.br-dd__item--danger,.br-dd__item--danger svg{color:var(--status-danger-fg)}', '.br-dd__item--danger:hover{background:var(--status-danger-bg);color:var(--status-danger-fg)}', '.br-dd__item--danger:hover svg{color:var(--status-danger-fg)}', '.br-dd__item:disabled{opacity:.45;cursor:not-allowed;background:transparent}', '.br-dd__item--on{color:var(--teal-600);font-weight:600}', '.br-dd__check{margin-left:auto;color:var(--teal-500)}', '.br-dd__sep{height:1px;background:var(--border-subtle);margin:6px -6px}', '.br-dd__short{margin-left:auto;font-size:12.5px;color:var(--text-muted)}'].join('');
function DropdownMenu({
  trigger,
  items,
  align = 'left',
  defaultOpen = false,
  onSelect,
  style
}) {
  __ds_scope.injectStyles('dropdown', CSS);
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', off);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return /*#__PURE__*/React.createElement("span", {
    className: "br-dd",
    ref: ref,
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(!open),
    style: {
      display: 'inline-flex'
    }
  }, trigger), open ? /*#__PURE__*/React.createElement("div", {
    role: "menu",
    className: 'br-dd__menu br-dd__menu--' + align
  }, items.map((it, i) => it.divider ? /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "br-dd__sep"
  }) : it.heading ? /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "br-dd__label"
  }, it.heading) : /*#__PURE__*/React.createElement("button", {
    key: i,
    role: "menuitem",
    type: "button",
    disabled: it.disabled,
    className: 'br-dd__item' + (it.danger ? ' br-dd__item--danger' : '') + (it.selected ? ' br-dd__item--on' : ''),
    onClick: () => {
      setOpen(false);
      if (it.onSelect) it.onSelect();
      if (onSelect) onSelect(it);
    }
  }, it.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 16
  }) : null, /*#__PURE__*/React.createElement("span", null, it.label), it.selected ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    strokeWidth: 2.25,
    className: "br-dd__check"
  }) : it.shortcut ? /*#__PURE__*/React.createElement("span", {
    className: "br-dd__short"
  }, it.shortcut) : null))) : null);
}
Object.assign(__ds_scope, { DropdownMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/DropdownMenu.jsx", error: String((e && e.message) || e) }); }

// ui_kits/autoship-admin/CustomerDetail.jsx
try { (() => {
(() => {
  const {
    Card,
    Badge,
    Chip,
    Button,
    Tabs,
    Breadcrumbs,
    DataTable,
    Dialog,
    Radio,
    Switch,
    Select,
    Alert,
    Checkbox
  } = window.BarkfieldRoadDesignSystem_ed681c;
  function Field({
    label,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 4
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15
      }
    }, children));
  }
  function CustomerDetail({
    sub,
    onBack,
    toast
  }) {
    const D = window.BR_DATA;
    const [tab, setTab] = React.useState('overview');
    const [status, setStatus] = React.useState(sub.status);
    const [dlg, setDlg] = React.useState(false);
    const [hold, setHold] = React.useState('1m');
    const [sms, setSms] = React.useState(true);
    const pause = () => {
      setStatus('Paused');
      setDlg(false);
      toast(sub.pup + '’s autoship paused', 'Resumes ' + (hold === '2w' ? 'Oct 16' : hold === '1m' ? 'Oct 30' : 'when you resume it') + '.');
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
      title: sub.name,
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm",
        iconLeft: "skip-forward",
        disabled: status !== 'Active',
        onClick: () => toast('Next delivery skipped', sub.pup + '’s box moves to Oct 30.')
      }, "Skip next"), status === 'Paused' ? /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        iconLeft: "play",
        onClick: () => {
          setStatus('Active');
          toast('Autoship resumed');
        }
      }, "Resume") : /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        iconLeft: "pause",
        disabled: status === 'Cancelled',
        onClick: () => setDlg(true)
      }, "Pause autoship"))
    }, /*#__PURE__*/React.createElement(Breadcrumbs, {
      items: [{
        label: 'Subscriptions',
        onClick: onBack
      }, {
        label: sub.name
      }],
      style: {
        marginBottom: 14
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: -12,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: D.tone[status],
      dot: true
    }, status), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)',
        fontSize: 14
      }
    }, "Subscription #", sub.id, " \xB7 Customer since ", sub.since)), /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      style: {
        marginBottom: 20
      },
      tabs: [{
        id: 'overview',
        label: 'Overview'
      }, {
        id: 'orders',
        label: 'Orders',
        count: D.orders.length
      }, {
        id: 'pups',
        label: 'Pups',
        count: 1
      }, {
        id: 'notes',
        label: 'Notes'
      }]
    }), status === 'Past due' ? /*#__PURE__*/React.createElement(Alert, {
      tone: "danger",
      title: "Card declined",
      style: {
        marginBottom: 16
      },
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "secondary",
        iconLeft: "mail",
        onClick: () => toast('Update link sent', 'Emailed to ' + sub.email)
      }, "Send update link")
    }, "Visa ending 4242 was declined on Sep 26. Next delivery is on hold until payment is updated.") : null, tab === 'orders' ? /*#__PURE__*/React.createElement(Card, {
      flush: true,
      title: "Order history"
    }, /*#__PURE__*/React.createElement(DataTable, {
      rows: D.orders,
      columns: [{
        key: 'id',
        header: 'Order',
        render: r => /*#__PURE__*/React.createElement("strong", null, r.id)
      }, {
        key: 'date',
        header: 'Date'
      }, {
        key: 'items',
        header: 'Items'
      }, {
        key: 'status',
        header: 'Status',
        render: r => /*#__PURE__*/React.createElement(Badge, {
          tone: r.status === 'Delivered' ? 'success' : 'neutral'
        }, r.status)
      }, {
        key: 'total',
        header: 'Total',
        align: 'right',
        render: r => '$' + r.total.toFixed(2)
      }]
    })) : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      eyebrow: "Autoship plan",
      title: sub.plan,
      actions: /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        iconLeft: "pencil"
      }, "Edit")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
        gap: 16,
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Size"
    }, sub.size), /*#__PURE__*/React.createElement(Field, {
      label: "Every"
    }, sub.freq, " weeks"), /*#__PURE__*/React.createElement(Field, {
      label: "Next delivery"
    }, status === 'Active' || status === 'Past due' ? sub.next : '—'), /*#__PURE__*/React.createElement(Field, {
      label: "Per box"
    }, '$' + sub.total.toFixed(2))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        paddingTop: 16,
        borderTop: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Delivery route",
      defaultValue: sub.route,
      options: [{
        value: 'A',
        label: 'Route A — Northport / Centerport'
      }, {
        value: 'B',
        label: 'Route B — Huntington / Commack'
      }, {
        value: 'C',
        label: 'Route C — Syosset / Greenlawn'
      }]
    }), /*#__PURE__*/React.createElement(Select, {
      label: "Window",
      defaultValue: "am",
      options: [{
        value: 'am',
        label: 'Morning · 9–12'
      }, {
        value: 'pm',
        label: 'Afternoon · 1–4'
      }]
    }))), /*#__PURE__*/React.createElement(Card, {
      title: "Upcoming",
      eyebrow: "Next 3 boxes"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, ['Thu, Oct 2', 'Thu, Oct 30', 'Thu, Nov 27'].map((d, i) => /*#__PURE__*/React.createElement("div", {
      key: d,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 0',
        borderTop: i ? '1px solid var(--border-subtle)' : 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--cream-200)',
        color: 'var(--teal-600)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: 15
      }
    }, d.split(' ')[2]), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600
      }
    }, d), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, sub.plan, " \xB7 ", sub.size, i === 0 ? ' + Pumpkin Bites' : '')), /*#__PURE__*/React.createElement(Badge, {
      tone: status === 'Paused' ? 'warning' : i === 0 && status === 'Past due' ? 'danger' : 'info'
    }, status === 'Paused' ? 'Paused' : i === 0 && status === 'Past due' ? 'On hold' : 'Scheduled')))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      tone: "cream",
      eyebrow: "Pup",
      title: sub.pup
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        color: 'var(--ink-700)',
        marginBottom: 12
      }
    }, sub.breed, " \xB7 6 yrs \xB7 68 lb"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
      }
    }, sub.tags.concat(['Loves pumpkin']).map(t => /*#__PURE__*/React.createElement(Chip, {
      key: t,
      variant: "tag",
      size: "sm"
    }, t)))), /*#__PURE__*/React.createElement(Card, {
      title: "Contact"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Email"
    }, /*#__PURE__*/React.createElement("a", {
      href: "#"
    }, sub.email)), /*#__PURE__*/React.createElement(Field, {
      label: "Phone"
    }, sub.phone), /*#__PURE__*/React.createElement(Field, {
      label: "Address"
    }, "14 Laurel Hill Rd, ", sub.town, ", NY"), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingTop: 12,
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Switch, {
      label: "SMS reminder 2 days before",
      checked: sms,
      onChange: setSms
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Leave at side gate",
      checked: true,
      onChange: () => {}
    })))))), /*#__PURE__*/React.createElement(Dialog, {
      open: dlg,
      onClose: () => setDlg(false),
      title: 'Pause ' + sub.pup + '’s autoship?',
      description: 'Deliveries stop until the pause ends. ' + sub.name.split(' ')[0] + ' gets an email confirmation.',
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: () => setDlg(false)
      }, "Keep active"), /*#__PURE__*/React.createElement(Button, {
        onClick: pause
      }, "Pause autoship"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, [['2w', '2 weeks', 'Resumes Oct 16'], ['1m', '1 month', 'Resumes Oct 30'], ['open', 'Until resumed manually']].map(([v, l, d]) => /*#__PURE__*/React.createElement(Radio, {
      key: v,
      name: "hold",
      value: v,
      label: l,
      description: d,
      checked: hold === v,
      onChange: setHold
    })))));
  }
  window.CustomerDetail = CustomerDetail;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/autoship-admin/CustomerDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/autoship-admin/Dashboard.jsx
try { (() => {
(() => {
  const {
    StatCard,
    Card,
    Badge,
    Button,
    DataTable,
    Alert
  } = window.BarkfieldRoadDesignSystem_ed681c;
  function Dashboard({
    onOpen,
    onNav
  }) {
    const D = window.BR_DATA;
    const today = D.subs.filter(s => s.next === 'Thu, Oct 2' || s.status === 'Past due');
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
      eyebrow: "Monday, September 29",
      title: "Dashboard",
      actions: /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        iconLeft: "download",
        size: "sm"
      }, "Export week")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
        gap: 16,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "Active autoships",
      value: "1,284",
      delta: "+38",
      trend: "up",
      caption: "this month",
      icon: "repeat"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Deliveries this week",
      value: "186",
      caption: "across 3 routes",
      icon: "truck"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Monthly recurring",
      value: "$92.4k",
      delta: "+4.1%",
      trend: "up",
      caption: "vs Aug",
      icon: "circle-dollar-sign"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Paused or past due",
      value: "108",
      delta: "+6",
      trend: "down",
      caption: "since last week",
      icon: "pause"
    })), /*#__PURE__*/React.createElement(Alert, {
      tone: "danger",
      title: "1 payment needs attention",
      style: {
        marginBottom: 20
      },
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "secondary",
        onClick: () => onOpen(D.subs[1])
      }, "Review")
    }, "Marcus Bell\u2019s card was declined on Sep 26 \u2014 Friday\u2019s Route B delivery is on hold."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      title: "Upcoming deliveries",
      flush: true,
      actions: /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        iconRight: "chevron-right",
        onClick: () => onNav('schedule')
      }, "Full schedule")
    }, /*#__PURE__*/React.createElement(DataTable, {
      rows: today,
      onRowClick: onOpen,
      columns: [{
        key: 'name',
        header: 'Customer',
        render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          style: {
            fontWeight: 600
          }
        }, r.name), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 13,
            color: 'var(--text-muted)'
          }
        }, r.pup, " \xB7 ", r.town))
      }, {
        key: 'plan',
        header: 'Order',
        render: r => r.plan + ' · ' + r.size
      }, {
        key: 'route',
        header: 'Route',
        render: r => 'Route ' + r.route
      }, {
        key: 'status',
        header: 'Status',
        render: r => /*#__PURE__*/React.createElement(Badge, {
          tone: D.tone[r.status],
          dot: true
        }, r.status === 'Active' ? 'Scheduled' : r.status)
      }]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      tone: "brand",
      eyebrow: "Today\u2019s route",
      title: "Route A \u2014 14 stops"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        color: 'var(--teal-100)',
        marginBottom: 14
      }
    }, "Leaves the shop at 8:30 AM \xB7 East Northport \u2192 Centerport"), /*#__PURE__*/React.createElement(Button, {
      variant: "cream",
      size: "sm",
      iconLeft: "route",
      onClick: () => onNav('schedule')
    }, "View route")), /*#__PURE__*/React.createElement(Card, {
      title: "Bakery add-ons",
      eyebrow: "This week"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontSize: 14.5
      }
    }, [['Pumpkin Bites', 42], ['Birthday Pupcakes', 7], ['Peanut Butter Bones', 31]].map(([n, q]) => /*#__PURE__*/React.createElement("div", {
      key: n,
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement("strong", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, q))))))));
  }
  window.Dashboard = Dashboard;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/autoship-admin/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/autoship-admin/Schedule.jsx
try { (() => {
(() => {
  const {
    Card,
    Chip,
    Tabs,
    Badge,
    Button,
    IconButton
  } = window.BarkfieldRoadDesignSystem_ed681c;
  const ROUTE = {
    A: 'var(--teal-500)',
    B: 'var(--terracotta-500)',
    C: 'var(--tan-500)',
    P: 'var(--ink-500)'
  };
  function Schedule({
    toast
  }) {
    const D = window.BR_DATA;
    const [routes, setRoutes] = React.useState(['A', 'B', 'C', 'P']);
    const [view, setView] = React.useState('week');
    const toggle = r => setRoutes(routes.includes(r) ? routes.filter(x => x !== r) : routes.concat([r]));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
      eyebrow: "Sep 29 \u2013 Oct 4",
      title: "Delivery schedule",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        icon: "chevron-left",
        label: "Previous week",
        variant: "secondary"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "chevron-right",
        label: "Next week",
        variant: "secondary"
      }), /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        iconLeft: "printer",
        variant: "secondary",
        onClick: () => toast('Pick list sent to printer')
      }, "Pick list"))
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16
      }
    }, [['A', 'Route A'], ['B', 'Route B'], ['C', 'Route C'], ['P', 'Store pickup']].map(([r, l]) => /*#__PURE__*/React.createElement(Chip, {
      key: r,
      selected: routes.includes(r),
      onClick: () => toggle(r)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: routes.includes(r) ? 'var(--cream-300)' : ROUTE[r],
        marginRight: 2,
        marginTop: -2,
        verticalAlign: 'middle'
      }
    }), l)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Tabs, {
      variant: "pill",
      value: view,
      onChange: setView,
      tabs: [{
        id: 'day',
        label: 'Day'
      }, {
        id: 'week',
        label: 'Week'
      }, {
        id: 'list',
        label: 'List'
      }]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0,1fr))',
        gap: 12
      }
    }, D.week.map((d, i) => {
      const stops = d.stops.filter(s => routes.includes(s.r));
      const today = i === 0;
      return /*#__PURE__*/React.createElement("div", {
        key: d.day,
        style: {
          background: 'var(--surface-card)',
          border: '1px solid ' + (today ? 'var(--teal-500)' : 'var(--border-default)'),
          borderRadius: 'var(--radius-md)',
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '12px 12px 10px',
          borderBottom: '1px solid var(--border-subtle)',
          background: today ? 'var(--teal-500)' : 'transparent',
          borderRadius: '5px 5px 0 0'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: today ? 'var(--tan-300)' : 'var(--tan-700)'
        }
      }, d.day, today ? ' · Today' : ''), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 20,
          color: today ? 'var(--cream-300)' : 'var(--teal-500)',
          letterSpacing: '.01em'
        }
      }, d.date)), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }
      }, stops.map(s => /*#__PURE__*/React.createElement("div", {
        key: s.n,
        style: {
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          background: s.hold ? 'var(--status-danger-bg)' : 'var(--surface-sunken)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: ROUTE[s.r],
          flexShrink: 0
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.2
        }
      }, s.n)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)'
        }
      }, s.t), s.hold ? /*#__PURE__*/React.createElement(Badge, {
        tone: "danger"
      }, "On hold") : null)), stops.length === 0 ? /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: 'var(--text-muted)',
          padding: 8
        }
      }, "No stops on selected routes.") : null), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 'auto',
          padding: '8px 12px',
          borderTop: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 12,
          color: 'var(--text-secondary)'
        }
      }, stops.length, " stop", stops.length === 1 ? '' : 's'));
    })));
  }
  window.Schedule = Schedule;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/autoship-admin/Schedule.jsx", error: String((e && e.message) || e) }); }

// ui_kits/autoship-admin/Shell.jsx
try { (() => {
(() => {
  const {
    SidebarNav,
    Input,
    IconButton,
    Button
  } = window.BarkfieldRoadDesignSystem_ed681c;
  function AdminShell({
    page,
    onNav,
    children,
    onNew
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        height: '100vh',
        background: 'var(--bg-app)'
      }
    }, /*#__PURE__*/React.createElement(SidebarNav, {
      logoSrc: "../../assets/logos/logo.svg",
      productName: "Autoship Admin",
      active: page,
      onSelect: onNav,
      sections: [{
        items: [{
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'layout-dashboard'
        }, {
          id: 'subscriptions',
          label: 'Subscriptions',
          icon: 'repeat',
          badge: 1
        }, {
          id: 'schedule',
          label: 'Delivery schedule',
          icon: 'calendar-days'
        }, {
          id: 'customers',
          label: 'Customers',
          icon: 'users'
        }]
      }, {
        title: 'Store',
        items: [{
          id: 'products',
          label: 'Products',
          icon: 'package'
        }, {
          id: 'routes',
          label: 'Routes',
          icon: 'route'
        }, {
          id: 'settings',
          label: 'Settings',
          icon: 'settings'
        }]
      }],
      footer: /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--cream-300)',
          color: 'var(--teal-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 13
        }
      }, "KN"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          lineHeight: 1.25
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          color: 'var(--text-primary)'
        }
      }, "Kevin Neglia"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)'
        }
      }, "Owner \xB7 East Northport")), /*#__PURE__*/React.createElement(IconButton, {
        icon: "log-out",
        label: "Sign out",
        size: "sm"
      }))
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        height: 'var(--topbar-h)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 32px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-default)'
      }
    }, /*#__PURE__*/React.createElement(Input, {
      iconLeft: "search",
      placeholder: "Search customers, pups, orders\u2026",
      size: "sm",
      style: {
        width: 360
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "bell",
      label: "Notifications"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "printer",
      label: "Print today's pick list"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "accent",
      iconLeft: "plus",
      size: "sm",
      onClick: onNew
    }, "New autoship")), /*#__PURE__*/React.createElement("main", {
      style: {
        flex: 1,
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
        padding: '28px 32px 48px'
      }
    }, children))));
  }
  function PageHeader({
    eyebrow,
    title,
    actions,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement("div", null, children, eyebrow ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: 'var(--tan-700)',
        marginBottom: 6
      }
    }, eyebrow) : null, /*#__PURE__*/React.createElement("h1", {
      style: {
        font: 'var(--type-h1)',
        letterSpacing: 'var(--tracking-display)',
        textTransform: 'uppercase',
        color: 'var(--teal-500)'
      }
    }, title)), actions ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, actions) : null);
  }
  Object.assign(window, {
    AdminShell,
    PageHeader
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/autoship-admin/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/autoship-admin/Subscriptions.jsx
try { (() => {
(() => {
  const {
    Card,
    DataTable,
    Pagination,
    Badge,
    Chip,
    Button,
    IconButton,
    Select,
    Tooltip
  } = window.BarkfieldRoadDesignSystem_ed681c;
  function Subscriptions({
    onOpen,
    toast
  }) {
    const D = window.BR_DATA;
    const [filter, setFilter] = React.useState('all');
    const [sel, setSel] = React.useState([]);
    const [sort, setSort] = React.useState({
      key: 'name',
      dir: 'asc'
    });
    const [page, setPage] = React.useState(1);
    const counts = {
      all: D.subs.length,
      Active: 0,
      Paused: 0,
      'Past due': 0,
      Cancelled: 0
    };
    D.subs.forEach(s => counts[s.status]++);
    let rows = filter === 'all' ? D.subs : D.subs.filter(s => s.status === filter);
    rows = rows.slice().sort((a, b) => {
      const x = a[sort.key],
        y = b[sort.key];
      return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1);
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
      title: "Subscriptions",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm",
        iconLeft: "download"
      }, "Export CSV"))
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap'
      }
    }, [['all', 'All'], ['Active', 'Active'], ['Paused', 'Paused'], ['Past due', 'Past due'], ['Cancelled', 'Cancelled']].map(([id, l]) => /*#__PURE__*/React.createElement(Chip, {
      key: id,
      selected: filter === id,
      onClick: () => {
        setFilter(id);
        setSel([]);
      },
      count: counts[id]
    }, l)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Select, {
      size: "sm",
      defaultValue: "all",
      style: {
        width: 150
      },
      options: [{
        value: 'all',
        label: 'All routes'
      }, 'Route A', 'Route B', 'Route C']
    }), /*#__PURE__*/React.createElement(Select, {
      size: "sm",
      defaultValue: "any",
      style: {
        width: 160
      },
      options: [{
        value: 'any',
        label: 'Any frequency'
      }, 'Every 2 weeks', 'Every 4 weeks', 'Every 6 weeks']
    })), /*#__PURE__*/React.createElement(Card, {
      flush: true
    }, sel.length ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 20px 12px',
        marginTop: -2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--teal-600)'
      }
    }, sel.length, " selected"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      iconLeft: "skip-forward",
      onClick: () => {
        toast('Skipped next delivery for ' + sel.length + ' subscription' + (sel.length > 1 ? 's' : ''));
        setSel([]);
      }
    }, "Skip next"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      iconLeft: "route"
    }, "Move route"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      onClick: () => setSel([])
    }, "Clear")) : null, /*#__PURE__*/React.createElement(DataTable, {
      selectable: true,
      selected: sel,
      onSelectChange: setSel,
      sort: sort,
      onSortChange: setSort,
      rows: rows,
      onRowClick: onOpen,
      columns: [{
        key: 'name',
        header: 'Customer',
        sortable: true,
        render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          style: {
            fontWeight: 600
          }
        }, r.name), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 13,
            color: 'var(--text-muted)'
          }
        }, "#", r.id, " \xB7 ", r.town))
      }, {
        key: 'pup',
        header: 'Pup',
        render: r => /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'flex-start'
          }
        }, /*#__PURE__*/React.createElement("span", null, r.pup), r.tags.length ? /*#__PURE__*/React.createElement(Chip, {
          variant: "tag",
          size: "sm"
        }, r.tags[0]) : null)
      }, {
        key: 'plan',
        header: 'Plan',
        render: r => /*#__PURE__*/React.createElement("span", null, r.plan, /*#__PURE__*/React.createElement("span", {
          style: {
            color: 'var(--text-muted)'
          }
        }, " \xB7 ", r.size))
      }, {
        key: 'freq',
        header: 'Every',
        sortable: true,
        render: r => r.freq + ' wks'
      }, {
        key: 'next',
        header: 'Next delivery',
        render: r => r.next
      }, {
        key: 'status',
        header: 'Status',
        render: r => /*#__PURE__*/React.createElement(Badge, {
          tone: D.tone[r.status],
          dot: true
        }, r.status)
      }, {
        key: 'total',
        header: 'Per box',
        align: 'right',
        sortable: true,
        render: r => r.total ? '$' + r.total.toFixed(2) : '—'
      }, {
        key: 'x',
        header: '',
        width: 84,
        render: r => /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            gap: 2
          },
          onClick: e => e.stopPropagation()
        }, /*#__PURE__*/React.createElement(Tooltip, {
          content: "Skip next delivery"
        }, /*#__PURE__*/React.createElement(IconButton, {
          icon: "skip-forward",
          label: "Skip next",
          size: "sm",
          onClick: () => toast('Skipped ' + r.pup + '’s next delivery')
        })), /*#__PURE__*/React.createElement(IconButton, {
          icon: "ellipsis",
          label: "More",
          size: "sm"
        }))
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement(Pagination, {
      page: page,
      pageCount: 52,
      total: 1284,
      pageSize: 25,
      onChange: setPage
    }))));
  }
  window.Subscriptions = Subscriptions;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/autoship-admin/Subscriptions.jsx", error: String((e && e.message) || e) }); }

// ui_kits/autoship-admin/data.js
try { (() => {
// Fake data for the Autoship Admin UI kit.
window.BR_DATA = (() => {
  const subs = [{
    id: 1042,
    name: 'Daniella Russo',
    email: 'daniella.russo@example.com',
    phone: '(631) 555-0142',
    town: 'East Northport',
    pup: 'Biscuit',
    breed: 'Golden Retriever',
    plan: 'Open Farm Lamb & Oat',
    size: '24 lb',
    freq: 4,
    next: 'Thu, Oct 2',
    route: 'A',
    status: 'Active',
    total: 89.99,
    since: 'Mar 2023',
    tags: ['Grain-free']
  }, {
    id: 1043,
    name: 'Marcus Bell',
    email: 'marcus.bell@example.com',
    phone: '(631) 555-0199',
    town: 'Huntington',
    pup: 'Juniper',
    breed: 'Australian Shepherd',
    plan: 'Raw Bistro Beef',
    size: '12 lb',
    freq: 2,
    next: 'Fri, Oct 3',
    route: 'B',
    status: 'Past due',
    total: 64.5,
    since: 'Jan 2024',
    tags: ['Raw']
  }, {
    id: 1047,
    name: 'Priya Shah',
    email: 'priya.s@example.com',
    phone: '(516) 555-0110',
    town: 'Syosset',
    pup: 'Mochi',
    breed: 'Shiba Inu',
    plan: 'Bakery Box — Large',
    size: '1 box',
    freq: 6,
    next: '—',
    route: 'C',
    status: 'Paused',
    total: 38.0,
    since: 'Aug 2024',
    tags: ['Bakery']
  }, {
    id: 1051,
    name: 'Tom Kearney',
    email: 'tkearney@example.com',
    phone: '(631) 555-0173',
    town: 'Northport',
    pup: 'Rufus',
    breed: 'Labrador',
    plan: 'Stella & Chewy’s Chicken',
    size: '24 lb',
    freq: 4,
    next: 'Mon, Oct 6',
    route: 'A',
    status: 'Active',
    total: 112.4,
    since: 'Nov 2022',
    tags: ['Senior']
  }, {
    id: 1055,
    name: 'Alicia Moreno',
    email: 'alicia.m@example.com',
    phone: '(631) 555-0128',
    town: 'Commack',
    pup: 'Pepper & Salt',
    breed: 'Mini Schnauzers',
    plan: 'Farmina N&D Pumpkin',
    size: '12 lb',
    freq: 3,
    next: 'Thu, Oct 2',
    route: 'B',
    status: 'Active',
    total: 71.25,
    since: 'May 2023',
    tags: ['2 pups']
  }, {
    id: 1058,
    name: 'Greg Olsen',
    email: 'golsen@example.com',
    phone: '(516) 555-0161',
    town: 'Greenlawn',
    pup: 'Duke',
    breed: 'German Shepherd',
    plan: 'Open Farm Salmon',
    size: '24 lb',
    freq: 4,
    next: 'Tue, Oct 7',
    route: 'C',
    status: 'Active',
    total: 94.0,
    since: 'Feb 2024',
    tags: ['Chicken allergy']
  }, {
    id: 1061,
    name: 'Hannah Lee',
    email: 'hannah.lee@example.com',
    phone: '(631) 555-0107',
    town: 'Centerport',
    pup: 'Olive',
    breed: 'Cavalier',
    plan: 'Honest Kitchen Base Mix',
    size: '10 lb',
    freq: 6,
    next: 'Wed, Oct 8',
    route: 'A',
    status: 'Active',
    total: 58.99,
    since: 'Jun 2024',
    tags: []
  }, {
    id: 1064,
    name: 'Sam Whitaker',
    email: 'samw@example.com',
    phone: '(631) 555-0184',
    town: 'Kings Park',
    pup: 'Bear',
    breed: 'Bernese Mountain Dog',
    plan: 'Raw Bistro Lamb',
    size: '24 lb',
    freq: 2,
    next: '—',
    route: 'B',
    status: 'Cancelled',
    total: 0,
    since: 'Sep 2023',
    tags: ['Raw']
  }];
  const tone = {
    Active: 'success',
    'Past due': 'danger',
    Paused: 'warning',
    Cancelled: 'neutral',
    Scheduled: 'info'
  };
  const orders = [{
    id: 'BR-20931',
    date: 'Sep 4, 2025',
    items: 'Open Farm Lamb & Oat 24 lb, Pumpkin Bites',
    total: 97.49,
    status: 'Delivered'
  }, {
    id: 'BR-20417',
    date: 'Aug 7, 2025',
    items: 'Open Farm Lamb & Oat 24 lb',
    total: 89.99,
    status: 'Delivered'
  }, {
    id: 'BR-19880',
    date: 'Jul 10, 2025',
    items: 'Open Farm Lamb & Oat 24 lb, Birthday Pupcake',
    total: 104.99,
    status: 'Delivered'
  }, {
    id: 'BR-19302',
    date: 'Jun 12, 2025',
    items: 'Open Farm Lamb & Oat 24 lb',
    total: 89.99,
    status: 'Refunded'
  }];
  const week = [{
    day: 'Mon',
    date: 'Sep 29',
    stops: [{
      n: 'Hannah Lee',
      r: 'A',
      t: '9–12'
    }, {
      n: 'Chris Pardo',
      r: 'A',
      t: '9–12'
    }, {
      n: 'Nina Voss',
      r: 'C',
      t: '1–4'
    }]
  }, {
    day: 'Tue',
    date: 'Sep 30',
    stops: [{
      n: 'Greg Olsen',
      r: 'C',
      t: '9–12'
    }, {
      n: 'Leah Tran',
      r: 'B',
      t: '1–4'
    }]
  }, {
    day: 'Wed',
    date: 'Oct 1',
    stops: [{
      n: 'Ben Carter',
      r: 'B',
      t: '9–12'
    }, {
      n: 'Jo Fitz',
      r: 'A',
      t: '1–4'
    }, {
      n: 'Ravi Patel',
      r: 'B',
      t: '1–4'
    }, {
      n: 'Ann Cho',
      r: 'C',
      t: '1–4'
    }]
  }, {
    day: 'Thu',
    date: 'Oct 2',
    stops: [{
      n: 'Daniella Russo',
      r: 'A',
      t: '9–12'
    }, {
      n: 'Alicia Moreno',
      r: 'B',
      t: '9–12'
    }, {
      n: 'Kate Dunn',
      r: 'A',
      t: '1–4'
    }]
  }, {
    day: 'Fri',
    date: 'Oct 3',
    stops: [{
      n: 'Marcus Bell',
      r: 'B',
      t: '9–12',
      hold: true
    }, {
      n: 'Pat Kim',
      r: 'C',
      t: '1–4'
    }]
  }, {
    day: 'Sat',
    date: 'Oct 4',
    stops: [{
      n: 'Store pickup ×6',
      r: 'P',
      t: 'All day'
    }]
  }];
  return {
    subs,
    tone,
    orders,
    week
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/autoship-admin/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ICONS = __ds_scope.ICONS;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.SidebarNav = __ds_scope.SidebarNav;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.DropdownMenu = __ds_scope.DropdownMenu;

})();

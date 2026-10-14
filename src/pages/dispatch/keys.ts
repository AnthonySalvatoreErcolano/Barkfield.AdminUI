// TanStack Query keys for dispatch. Everything hangs off ['dispatch'], so a send or withdraw refreshes
// the board and any open load list together.
export const dispatchKeys = {
  all: ['dispatch'] as const,
  board: (date: string) => ['dispatch', 'board', date] as const,
  loadList: (routeId: string) => ['dispatch', 'load-list', routeId] as const,
};

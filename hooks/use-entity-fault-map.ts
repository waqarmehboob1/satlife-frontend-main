'use client';

import { useMemo } from 'react';
import { useDataStore } from '@/lib/data-store';
import { buildEntityFaultMap } from '@/lib/entity-fault-badges';

export function useEntityFaultMap() {
  const {
    faultyEntities,
    maintenanceCases,
    orders,
    projects,
    systems,
    subsystems,
    modules,
    units,
    components,
  } = useDataStore();

  return useMemo(
    () =>
      buildEntityFaultMap({
        faultyEntities,
        maintenanceCases,
        hierarchy: { orders, projects, systems, subsystems, modules, units, components },
      }),
    [
      faultyEntities,
      maintenanceCases,
      orders,
      projects,
      systems,
      subsystems,
      modules,
      units,
      components,
    ]
  );
}

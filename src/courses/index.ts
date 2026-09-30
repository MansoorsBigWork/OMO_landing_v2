import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { Omoship } from "./types";
import { ukDeliveryNetwork } from "./uk-delivery-network/course";

/* Registry of OMOships. The portal reads the course data eagerly (it is
   small) to list them; each course's pages, styles and assets stay in
   their own lazily loaded chunk, so adding a course never grows the
   bundle for students who do not open it.

   To add a course: create src/courses/<slug>/ with a course.ts and a
   routes.tsx (see uk-delivery-network), then add one entry here. */

/* Every course mounts under this path; the pages link with it spelled out. */
export const COURSE_BASE = "/portal/omoships";

export const coursePath = (slug: string): string => `${COURSE_BASE}/${slug}`;

export interface OmoshipEntry {
  course: Omoship;
  Routes: LazyExoticComponent<ComponentType>;
}

export const omoshipEntries: ReadonlyArray<OmoshipEntry> = [
  { course: ukDeliveryNetwork, Routes: lazy(() => import("./uk-delivery-network/routes")) },
];

export const omoships: ReadonlyArray<Omoship> = omoshipEntries.map((entry) => entry.course);

export const findOmoship = (slug: string): OmoshipEntry | undefined =>
  omoshipEntries.find((entry) => entry.course.slug === slug);

import type { ReactNode } from "react";

export interface Leaf {
  id: string;
  /** Content rendered on the front (right-hand) face of this leaf. */
  front: ReactNode;
  /** Content rendered on the back (left-hand) face of this leaf. */
  back: ReactNode;
}

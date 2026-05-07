import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParams } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParams>();

/**
 * Programmatic navigation usable from outside the React tree (notification
 * tap handlers, deep links, etc.). If the navigation container isn't ready
 * yet (cold-start tap), polls briefly until it is — gives up after ~5s so
 * we never leak an interval.
 */
export function navigate<R extends keyof RootStackParams>(
  name: R,
  params?: RootStackParams[R],
): void {
  const dispatch = () =>
    navigationRef.dispatch(
      CommonActions.navigate({ name: name as string, params: params as object | undefined }),
    );

  if (navigationRef.isReady()) {
    dispatch();
    return;
  }

  const start = Date.now();
  const interval = setInterval(() => {
    if (navigationRef.isReady()) {
      clearInterval(interval);
      dispatch();
    } else if (Date.now() - start > 5000) {
      clearInterval(interval);
    }
  }, 50);
}

import { router, useNavigation } from 'expo-router';
import { StackActions } from '@react-navigation/native';

/**
 * Moves out of the check-in flow. The check-in screens live in their own little stack
 * (src/app/checkin) inside the app's main stack, so "leaving" means acting on the PARENT stack.
 */
export function useCheckInNav() {
  const navigation = useNavigation();
  const root = () => navigation.getParent() ?? navigation;

  return {
    /** Close the whole check-in flow and return to wherever the user came from. */
    leave: () => root().goBack(),
    /** After saving a NEW check-in: low battery -> screen 15, otherwise -> the daily log. */
    finishNew: (isLow: boolean) => {
      if (isLow) {
        root().dispatch(StackActions.replace('low-battery'));
      } else {
        root().dispatch(StackActions.popToTop());
        router.navigate('/tracker');
      }
    },
  };
}

import React, {
  PropsWithChildren,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type SheetSnap = "mini" | "half" | "full";

export type InformationSheetRef = {
  snapTo: (snap: SheetSnap) => void;
  getSnap: () => SheetSnap;
};

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;

  /** where it starts when opened */
  initialSnap?: SheetSnap;

  /** tapping backdrop closes (default true) */
  closeOnBackdropPress?: boolean;
}>;

export const InformationView = forwardRef<InformationSheetRef, Props>(
  (
    {
      isVisible,
      children,
      onClose,
      initialSnap = "half",
      closeOnBackdropPress = true,
    },
    ref
  ) => {
    const { height: H } = Dimensions.get("window");

    // visible heights (Google-translate-ish)
    const FULL_H = Math.round(H * 0.92);
    const HALF_H = Math.round(H * 0.56);
    const MINI_H = Math.round(H * 0.18);

    // container is always FULL_H tall; translate down to show less
    const toTranslateY = (snap: SheetSnap) => {
      if (snap === "full") return 0;
      if (snap === "half") return FULL_H - HALF_H;
      return FULL_H - MINI_H;
    };

    const currentSnap = useRef<SheetSnap>(initialSnap);
    const translateY = useRef(new Animated.Value(toTranslateY(initialSnap))).current;

    const snapTo = (snap: SheetSnap) => {
      currentSnap.current = snap;
      Animated.spring(translateY, {
        toValue: toTranslateY(snap),
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
        mass: 0.9,
      }).start();
    };

    useImperativeHandle(ref, () => ({
      snapTo,
      getSnap: () => currentSnap.current,
    }));

    // reset whenever it opens
    useEffect(() => {
      if (isVisible) {
        currentSnap.current = initialSnap;
        translateY.setValue(toTranslateY(initialSnap));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible, initialSnap]);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
          onPanResponderMove: (_, g) => {
            const base = toTranslateY(currentSnap.current);
            const next = Math.min(Math.max(0, base + g.dy), toTranslateY("mini"));
            translateY.setValue(next);
          },
          onPanResponderRelease: (_, g) => {
            // quick flings
            if (g.vy < -0.75) return snapTo("full");
            if (g.vy > 0.85) return snapTo("mini");

            // snap to nearest based on current position
            const y = (translateY as any)._value ?? toTranslateY("half");
            const yFull = toTranslateY("full");
            const yHalf = toTranslateY("half");
            const yMini = toTranslateY("mini");

            const dFull = Math.abs(y - yFull);
            const dHalf = Math.abs(y - yHalf);
            const dMini = Math.abs(y - yMini);

            if (dFull <= dHalf && dFull <= dMini) snapTo("full");
            else if (dHalf <= dMini) snapTo("half");
            else snapTo("mini");
          },
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    return (
      <Modal transparent animationType="fade" visible={isVisible} onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeOnBackdropPress ? onClose : undefined}
        />
        <Animated.View style={[styles.sheet, { height: FULL_H, transform: [{ translateY }] }]}>
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="cancel" color="rgba(255,255,255,0.45)" size={28} />
            </TouchableOpacity>
          </View>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#25292e",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  header: {
    height: 40,
    backgroundColor: "#464C55",
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  closeBtn: {
    position: "absolute",
    right: 4,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 14,
  },
});

InformationView.displayName = "InformationView";
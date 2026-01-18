import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="history">
        <Label>History</Label>
        <Icon sf="clock" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <Label>Scan</Label>
        <Icon sf="camera" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leaderboard">
        <Label>Leaderboard</Label>
        <Icon sf="chart.bar" drawable="custom_settings_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

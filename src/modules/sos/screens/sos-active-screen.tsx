import SosActiveIcon from "@/assets/icons/actions/sos-activated.svg";
import { BrandColors, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./sos-active-screen.styles";

export function SosActiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleStopSOS = () => {
    // TODO: Call the backend to deactivate/stop the active SOS.
    router.replace("/sos");
  };

  return (
    <>
      <StatusBar style="light" />
      <PageLayout
        title="SOS"
        scrollable={false}
        showBackButton={false}
        backgroundColor={BrandColors.error}
        dividerColor="rgba(255, 255, 255, 0.35)"
        headerTextColor={BrandColors.secondary}
        contentStyle={styles.content}
        footerStyle={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        footer={
          <SlideButton
            label="Slide to stop SOS"
            onComplete={handleStopSOS}
            trackColor="#FFE1E3"
            borderColor="#FFE1E3"
            thumbColor={BrandColors.error}
            labelColor={BrandColors.error}
            arrowColor={BrandColors.secondary}
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.messageSection}>
            <Text style={[Typography.largeTitle, styles.title]}>Slide to stop</Text>
            <Text style={[Typography.body, styles.description]}>
              SOS countdown finished. Contact delivery has not been confirmed.
            </Text>
          </View>

          <View style={styles.iconSection}>
            <SosActiveIcon width={90} height={90} />
          </View>
        </View>
      </PageLayout>
    </>
  );
}

import SosActiveIcon from "@/assets/icons/actions/sos-activated.svg";
import { BrandColors, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui/page-layout";
import { SlideButton } from "@/shared/ui/slide-button";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { styles } from "./sos-active-screen.styles";

export function SosActiveScreen() {
  const router = useRouter();

  const handleStopSOS = () => {
    // TODO: Call the backend to deactivate/stop the active SOS.
    router.replace("/sos" as any);
  };

  return (
    <PageLayout
      title="SOS"
      scrollable={false}
      showBackButton={false}
      backgroundColor={BrandColors.error}
      dividerColor="rgba(255, 255, 255, 0.35)"
      headerTextColor={BrandColors.secondary}
      contentStyle={styles.content}
      footerStyle={styles.footer}
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
          <Text style={[Typography.largeTitle, styles.title]}>
            Slide to stop
          </Text>

          <Text style={[Typography.body, styles.description]}>
            Your location were sent to your emergency{"\n"}
            contacts.
          </Text>
        </View>

        <View style={styles.iconSection}>
          <SosActiveIcon width={90} height={90} />
        </View>
      </View>
    </PageLayout>
  );
}

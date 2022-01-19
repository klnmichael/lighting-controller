import styles from "./layout.module.scss";
import { useSiteState } from "@/states/use-site-state";
import TopBar from "@/components/top-bar";
import Grid from "@/components/grid";
import Device from "@/components/device";
import Seeker from "@/components/seeker";

const Layout = () => {
  const { devices, addDevice } = useSiteState();

  return (
    <div className={styles["container"]}>
      <div className={styles["top-bar"]}>
        <TopBar />
      </div>
      <div className={styles["grid"]}>
        <Grid />
      </div>
      <div className={styles["devices"]}>
        {devices.map((device, index) => (
          <Device key={index} index={index} device={device} />
        ))}
        <button
          type="button"
          className={styles["add"]}
          onClick={() => addDevice()}
        >
          +
        </button>
      </div>
      <div className={styles["seeker"]}>
        <Seeker />
      </div>
    </div>
  );
};

export default Layout;

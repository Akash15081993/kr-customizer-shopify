import Header from './header';
import Image from 'next/image';
import stylesPage from "../../assets/css/dashboard.module.css";
import langEng from "@/lang/en";

const DashboardUI = () => (
    <div>
        <Header isActiveMenu="dashboard" />

    <div className={stylesPage.dashboard}>
        <div className={stylesPage.inner_content}>
        <div className={stylesPage.ic_right}>
            <Image
            src="/assets/app-default-dashboard.png"
            alt="default-dashboard"
            width={500}
            height={454}
            style={{ objectFit: "contain" }}
            />
        </div>

        <div className={stylesPage.ic_left}>
            <h1>
            Bring your Guns, T-Shirts & Mugs portfolio to life with our
            powerful 3D product customizers.
            </h1>
            <p style={{ marginTop: "20px", fontSize: "18px", textAlign: "center" }}>
            Easily personalize, visualize, and manage your store’s products
            with <b>{langEng?.appDetails?.name}</b>.
            </p>
        </div>
        </div>

        <div className={stylesPage.contact_info}>
        <h2>{langEng?.appDetails?.name}</h2>
        <p>
            A variety of packages are offered. Please contact your{" "}
            <b>{langEng?.appDetails?.name}</b> Account Manager or <br />
            <a href={`mailto:${langEng?.appDetails?.email}`}>
            {langEng?.appDetails?.email}
            </a>{" "}
            for more information.
        </p>
        </div>
    </div>
    </div>
);

export default DashboardUI;

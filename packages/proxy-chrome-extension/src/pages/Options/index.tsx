import React from "react";
import { createRoot } from "react-dom/client";

import Options from "./Options";
import "../../styles.css";

const container = document.getElementById("app-container");
const root = createRoot(container!);
root.render(<Options title={"Settings"} />);

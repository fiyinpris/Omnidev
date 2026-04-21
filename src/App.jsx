import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TickerBar } from "./components/TickerBar";
import { Navbar } from "./components/Navbar";
import { CursorDot } from "./components/CursorDot";
import { Home } from "./components/Home";

function App() {
  return (
    <BrowserRouter>
      <CursorDot />
      <TickerBar />
      <Navbar />
      <Routes>
        <Route index element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

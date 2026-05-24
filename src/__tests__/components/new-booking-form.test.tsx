/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react");

  type SelectContextValue = {
    value: string | undefined;
    onValueChange: ((v: string) => void) | undefined;
    disabled: boolean | undefined;
    selectId: string;
    setSelectId: (id: string) => void;
  };

  const SelectContext = React.createContext<SelectContextValue | null>(null);

  const Select = ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
    disabled?: boolean;
  }) => {
    const [selectId, setSelectId] = React.useState("");

    return (
      <SelectContext.Provider
        value={{ value, onValueChange, disabled, selectId, setSelectId }}
      >
        <select
          id={selectId}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          {children}
        </select>
      </SelectContext.Provider>
    );
  };

  const SelectTrigger = ({ id }: { id?: string }) => {
    const ctx = React.useContext(SelectContext);

    React.useEffect(() => {
      if (id) {
        ctx?.setSelectId(id);
      }
    }, [id, ctx]);

    return null;
  };

  const SelectValue = ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  );

  const SelectContent = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );

  const extractText = (node: React.ReactNode): string => {
    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }

    if (Array.isArray(node)) {
      return (node as React.ReactNode[]).map(extractText).join("");
    }

    if (React.isValidElement(node)) {
      return extractText(
        (node.props as { children?: React.ReactNode }).children,
      );
    }

    return "";
  };

  const SelectItem = ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{extractText(children) || value}</option>;

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { NewBookingForm } from "@/components/modules/booking/new-booking-form";

const mockToast = toast as unknown as {
  success: jest.Mock;
  error: jest.Mock;
};

const mockPush = jest.fn();
const mockRefresh = jest.fn();

const chairs = [
  {
    id: "chair-1",
    name: "Silla A",
    color: "#6366f1",
  },
  {
    id: "chair-2",
    name: "Silla B",
    color: "#f59e0b",
  },
];

const mockServices = [
  {
    id: "svc-1",
    name: "Corte de cabello",
    durationMinutes: 60,
    price: "25.00",
  },
];

const mockSlots = ["09:00", "10:00", "11:00"];

function makeFetchMock(postOk = true, postError = "Error al crear la reserva") {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes("/api/public/services")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockServices),
      });
    }

    if (url.includes("/api/public/availability")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSlots),
      });
    }

    return Promise.resolve({
      ok: postOk,
      json: () =>
        postOk
          ? Promise.resolve({
              id: "booking-new",
            })
          : Promise.resolve({
              error: postError,
            }),
    });
  });
}

function setup() {
  const user = userEvent.setup();

  render(<NewBookingForm chairs={chairs} />);

  return { user };
}

async function fillAndSubmit() {
  const user = userEvent.setup();

  render(<NewBookingForm chairs={chairs} />);

  // Puesto
  await user.selectOptions(screen.getByLabelText("Puesto"), "chair-1");

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/public/services"),
    );
  });

  // Servicio
  await user.selectOptions(screen.getByLabelText("Servicio"), "svc-1");

  // Fecha
  fireEvent.change(screen.getByLabelText("Fecha"), {
    target: {
      value: "2030-03-01",
    },
  });

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/public/availability"),
    );
  });

  // Espera slots
  await waitFor(() => {
    expect(
      screen.getByRole("option", {
        name: "9:00 AM",
      }),
    ).toBeInTheDocument();
  });

  // Hora
  const timeSelect = screen.getByLabelText(
    "Hora disponible",
  ) as HTMLSelectElement;

  fireEvent.change(timeSelect, {
    target: {
      value: "09:00",
    },
  });

  // verifica que sí cambió
  await waitFor(() => {
    expect(timeSelect.value).toBe("09:00");
  });

  // Nombre
  fireEvent.change(screen.getByLabelText("Nombre *"), { target: { value: "Maria Garcia" } });

  // Teléfono
  fireEvent.change(screen.getByLabelText("Teléfono *"), { target: { value: "61234567" } });

  // Submit
  await user.click(
    screen.getByRole("button", {
      name: "Crear reserva",
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
  });

  global.fetch = makeFetchMock();
});

afterEach(() => {
  cleanup();
});

describe("NewBookingForm — renderizado", () => {
  it("muestra el título Nueva reserva", () => {
    setup();

    expect(screen.getByText("Nueva reserva")).toBeInTheDocument();
  });

  it("muestra el enlace Volver a reservas", () => {
    setup();

    expect(screen.getByText("Volver a reservas").closest("a")).toHaveAttribute(
      "href",
      "/booking",
    );
  });

  it("muestra labels principales", () => {
    setup();

    expect(screen.getByText("Puesto")).toBeInTheDocument();

    expect(screen.getByLabelText("Fecha")).toBeInTheDocument();

    expect(screen.getByLabelText("Nombre *")).toBeInTheDocument();
  });

  it("muestra botón crear reserva", () => {
    setup();

    expect(
      screen.getByRole("button", {
        name: "Crear reserva",
      }),
    ).toBeInTheDocument();
  });
});

describe("NewBookingForm — fetch de servicios", () => {
  it("llama a services cuando se selecciona un puesto", async () => {
    const { user } = setup();

    const selects = screen.getAllByRole("combobox");

    await user.selectOptions(selects[0], "chair-1");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("chairId=chair-1"),
      );
    });
  });

  it("muestra servicios cargados", async () => {
    const { user } = setup();

    const selects = screen.getAllByRole("combobox");

    await user.selectOptions(selects[0], "chair-1");

    expect(
      screen.getByRole("option", { name: "Corte de cabello — 60 min" }),
    ).toBeInTheDocument();
  });

  it("no hace fetch si no hay puesto", () => {
    setup();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("NewBookingForm — disponibilidad", () => {
  it("llama availability cuando los campos están completos", async () => {
    const { user } = setup();

    const selects = screen.getAllByRole("combobox");

    await user.selectOptions(selects[0], "chair-1");

    await user.selectOptions(selects[1], "svc-1");

    fireEvent.change(screen.getByLabelText("Fecha"), {
      target: {
        value: "2030-03-01",
      },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/public/availability"),
      );
    });
  });
});

describe("NewBookingForm — validación", () => {
  it("muestra error de nombre", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: "Crear reserva",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/nombre debe tener al menos/i),
      ).toBeInTheDocument();
    });
  });

  it("muestra error cuando el teléfono no inicia con 6", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("Teléfono *"), "71234567");

    await user.click(
      screen.getByRole("button", { name: "Crear reserva" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/teléfono debe iniciar con 6/i),
      ).toBeInTheDocument();
    });
  });

  it("no hace POST con correo inválido", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("Correo electrónico"), "correo-mal");

    await user.click(
      screen.getByRole("button", {
        name: "Crear reserva",
      }),
    );

    await waitFor(() => {
      const postCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (c: unknown[]) => c[0] === "/api/bookings",
      );

      expect(postCalls).toHaveLength(0);
    });
  });
});

describe("NewBookingForm — submit", () => {
  it("hace POST correcto", async () => {
    await fillAndSubmit();

    await waitFor(() => {
      const postCall = (global.fetch as jest.Mock).mock.calls.find(
        (c: unknown[]) => c[0] === "/api/bookings",
      );

      expect(postCall).toBeDefined();

      const body = JSON.parse((postCall?.[1] as RequestInit).body as string);

      expect(body).toMatchObject({
        chairId: "chair-1",
        serviceId: "svc-1",
        time: "09:00",
        name: "Maria Garcia",
      });
    });
  });

  it("muestra success y redirige", async () => {
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        "Reserva creada correctamente",
      );

      expect(mockPush).toHaveBeenCalledWith("/booking");

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("muestra error del servidor", async () => {
    global.fetch = makeFetchMock(false, "Sin disponibilidad en ese horario");

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Sin disponibilidad en ese horario",
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});

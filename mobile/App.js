import "react-native-screens";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/context/AuthContext";
import { BookingProvider } from "./src/context/BookingContext";
import AuthNavigationSync from "./src/navigation/AuthNavigationSync";
import { navigationRef } from "./src/navigation/navigationRef";
import { getAdminStackScreens } from "./src/navigation/adminRoutes";
import SearchScreen from "./src/screens/SearchScreen";
import AccommodationDetailScreen from "./src/screens/AccommodationDetailScreen";
import BookingFormScreen from "./src/screens/BookingFormScreen";
import PaymentScreen from "./src/screens/PaymentScreen";
import ConfirmationScreen from "./src/screens/ConfirmationScreen";
import LoginScreen from "./src/screens/LoginScreen";
import AdminHomeScreen from "./src/screens/AdminHomeScreen";
import AdminReservaDetailScreen from "./src/screens/AdminReservaDetailScreen";
import AdminSucursalFormScreen from "./src/screens/admin/AdminSucursalFormScreen";
import AdminTipoHabitacionFormScreen from "./src/screens/admin/AdminTipoHabitacionFormScreen";
import AdminHabitacionFormScreen from "./src/screens/admin/AdminHabitacionFormScreen";
import AdminTarifaFormScreen from "./src/screens/admin/AdminTarifaFormScreen";
import AdminCatalogoServicioFormScreen from "./src/screens/admin/AdminCatalogoServicioFormScreen";
import AdminClienteFormScreen from "./src/screens/admin/AdminClienteFormScreen";
import AdminReservaFormScreen from "./src/screens/admin/AdminReservaFormScreen";
import AdminEstadiaDetailScreen from "./src/screens/admin/AdminEstadiaDetailScreen";
import AdminCargoEstadiaFormScreen from "./src/screens/admin/AdminCargoEstadiaFormScreen";
import AdminValoracionDetailScreen from "./src/screens/admin/AdminValoracionDetailScreen";
import AdminFacturaDetailScreen from "./src/screens/admin/AdminFacturaDetailScreen";
import AdminPagoFormScreen from "./src/screens/admin/AdminPagoFormScreen";
import AdminUsuarioFormScreen from "./src/screens/admin/AdminUsuarioFormScreen";
import AdminUsuarioRolesScreen from "./src/screens/admin/AdminUsuarioRolesScreen";
import AdminRolFormScreen from "./src/screens/admin/AdminRolFormScreen";
import AdminRolPermisosScreen from "./src/screens/admin/AdminRolPermisosScreen";
import AdminAuditoriaDetailScreen from "./src/screens/admin/AdminAuditoriaDetailScreen";
import { colors } from "./src/styles/theme";

const Stack = createNativeStackNavigator();
const adminScreens = getAdminStackScreens();

export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <NavigationContainer ref={navigationRef}>
          <AuthNavigationSync />
          <Stack.Navigator
            initialRouteName="Search"
            screenOptions={{
              headerStyle: { backgroundColor: colors.nav },
              headerTintColor: colors.onPrimary,
              headerTitleStyle: { fontWeight: "700" },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: "Hotel Luxemburgo" }}
            />
            <Stack.Screen
              name="AccommodationDetail"
              component={AccommodationDetailScreen}
              options={{ title: "Alojamiento" }}
            />
            <Stack.Screen
              name="BookingForm"
              component={BookingFormScreen}
              options={{ title: "Tus datos" }}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ title: "Pago" }}
            />
            <Stack.Screen
              name="Confirmation"
              component={ConfirmationScreen}
              options={{ title: "Confirmación" }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Admin login" }}
            />
            <Stack.Screen
              name="AdminHome"
              component={AdminHomeScreen}
              options={{ title: "Panel admin" }}
            />
            {adminScreens.map((screen) => (
              <Stack.Screen
                key={screen.name}
                name={screen.name}
                component={screen.component}
                options={screen.options}
                initialParams={screen.options.initialParams}
              />
            ))}
            <Stack.Screen
              name="AdminReservaDetail"
              component={AdminReservaDetailScreen}
              options={{ title: "Detalle reserva" }}
            />
            <Stack.Screen
              name="AdminSucursalForm"
              component={AdminSucursalFormScreen}
              options={{ title: "Sucursal" }}
            />
            <Stack.Screen
              name="AdminTipoHabitacionForm"
              component={AdminTipoHabitacionFormScreen}
              options={{ title: "Tipo habitación" }}
            />
            <Stack.Screen
              name="AdminHabitacionForm"
              component={AdminHabitacionFormScreen}
              options={{ title: "Habitación" }}
            />
            <Stack.Screen
              name="AdminTarifaForm"
              component={AdminTarifaFormScreen}
              options={{ title: "Tarifa" }}
            />
            <Stack.Screen
              name="AdminCatalogoServicioForm"
              component={AdminCatalogoServicioFormScreen}
              options={{ title: "Catálogo" }}
            />
            <Stack.Screen
              name="AdminClienteForm"
              component={AdminClienteFormScreen}
              options={{ title: "Cliente" }}
            />
            <Stack.Screen
              name="AdminReservaForm"
              component={AdminReservaFormScreen}
              options={{ title: "Nueva reserva" }}
            />
            <Stack.Screen
              name="AdminEstadiaDetail"
              component={AdminEstadiaDetailScreen}
              options={{ title: "Estadía" }}
            />
            <Stack.Screen
              name="AdminCargoEstadiaForm"
              component={AdminCargoEstadiaFormScreen}
              options={{ title: "Nuevo cargo" }}
            />
            <Stack.Screen
              name="AdminValoracionDetail"
              component={AdminValoracionDetailScreen}
              options={{ title: "Valoración" }}
            />
            <Stack.Screen
              name="AdminFacturaDetail"
              component={AdminFacturaDetailScreen}
              options={{ title: "Factura" }}
            />
            <Stack.Screen
              name="AdminPagoForm"
              component={AdminPagoFormScreen}
              options={{ title: "Registrar pago" }}
            />
            <Stack.Screen
              name="AdminUsuarioForm"
              component={AdminUsuarioFormScreen}
              options={{ title: "Usuario" }}
            />
            <Stack.Screen
              name="AdminUsuarioRoles"
              component={AdminUsuarioRolesScreen}
              options={{ title: "Roles del usuario" }}
            />
            <Stack.Screen
              name="AdminRolForm"
              component={AdminRolFormScreen}
              options={{ title: "Rol" }}
            />
            <Stack.Screen
              name="AdminRolPermisos"
              component={AdminRolPermisosScreen}
              options={{ title: "Permisos del rol" }}
            />
            <Stack.Screen
              name="AdminAuditoriaDetail"
              component={AdminAuditoriaDetailScreen}
              options={{ title: "Evento auditoría" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BookingProvider>
    </AuthProvider>
  );
}

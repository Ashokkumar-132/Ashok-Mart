import { createFileRoute, Link } from "@tanstack/react-router";

import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { useAddresses, useAuthUser, useProfile } from "@/hooks/useAshokMart";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Account — AshokMart" },
      { name: "description", content: "View your AshokMart profile details, saved delivery address and order history." },
      { property: "og:title", content: "My Account — AshokMart" },
      { property: "og:description", content: "Your AshokMart profile and saved delivery address." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const user = useAuthUser();
  const { data: profile } = useProfile(user?.id);
  const { data: addresses } = useAddresses(user?.id);
  const address = addresses?.[0];

  return (
    <CustomerShell>
      <h1 className="mb-5 font-display text-2xl font-bold text-navy">My Account</h1>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-display text-base font-bold text-navy">Profile</h2>
          <dl className="space-y-2 text-sm">
            <Item label="Full Name" value={profile?.full_name ?? "—"} />
            <Item label="Email" value={profile?.email ?? user?.email ?? "—"} />
            <Item label="Mobile" value={profile?.phone || "—"} />
            <Item label="Role" value="Customer" />
          </dl>
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 font-display text-base font-bold text-navy">Delivery Address</h2>
          {address ? (
            <address className="text-sm leading-relaxed text-muted-foreground not-italic">
              {address.full_name}
              <br />
              {address.house_number}, {address.street}, {address.area}
              <br />
              {address.city}, {address.state} — {address.pincode}
              <br />
              Phone: {address.phone}
            </address>
          ) : (
            <p className="text-sm text-muted-foreground">No address saved yet.</p>
          )}
          <Link to="/address">
            <Button size="sm" className="mt-4 bg-orange text-orange-foreground hover:bg-orange/90">
              {address ? "Edit Address" : "Add Address"}
            </Button>
          </Link>
        </section>
      </div>
    </CustomerShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}

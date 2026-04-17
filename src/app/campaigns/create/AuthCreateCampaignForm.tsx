"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
    campaign_type: z.enum(["individual", "organization"], { message: "Please select a campaign type" }),
    name:          z.string().min(1, "Campaign name is required").max(50),
});

type FormData = z.infer<typeof schema>;

const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

export default function AuthCreateCampaignForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [nameTaken, setNameTaken] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema) });

    const selectedType = watch("campaign_type");

    async function onSubmit(data: FormData) {
        setServerError(null);
        setNameTaken(false);
        const [res] = await Promise.all([
            fetch("/api/v1/campaigns/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }),
            new Promise((r) => setTimeout(r, 800)),
        ]);
        const contentType = res.headers.get("content-type") ?? "";
        const json = contentType.includes("application/json")
            ? await res.json()
            : { error: "An unexpected error occurred. Please try again." };
        if (res.status === 409 && json.code === "name_taken") {
            setNameTaken(true);
            return;
        }
        if (!res.ok) {
            setServerError(json.error ?? "Something went wrong. Please try again.");
            return;
        }
        router.push(`/campaigns/${json.campaign.slug}/create`);
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-7 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Start your <span className="text-orange-500">Campaign</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Fill in the basics to create your campaign.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Campaign type */}
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Campaign Type <span className="text-red-500">*</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {(["individual", "organization"] as const).map((type) => (
                                <label
                                    key={type}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                        selectedType === type
                                            ? "border-orange-500 bg-orange-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={selectedType === type}
                                        onChange={() => setValue("campaign_type", type, { shouldValidate: true })}
                                        className="sr-only"
                                    />
                                    {type === "individual" ? (
                                        <svg className={`w-8 h-8 ${selectedType === type ? "text-orange-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    ) : (
                                        <svg className={`w-8 h-8 ${selectedType === type ? "text-orange-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    )}
                                    <div className="text-center">
                                        <p className={`text-sm font-semibold ${selectedType === type ? "text-orange-600" : "text-gray-700"}`}>
                                            {type === "individual" ? "Individual" : "Organization"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {type === "individual" ? "Personal fundraising" : "Team fundraising"}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.campaign_type && (
                            <p className="text-xs text-red-500 mt-2">{errors.campaign_type.message}</p>
                        )}
                    </div>

                    {/* Campaign name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                            Campaign Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("name")}
                            placeholder="e.g. Rising Stars Cricket Fund"
                            maxLength={50}
                            className={inputCls}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                        )}
                        {nameTaken && (
                            <p className="text-xs text-red-500 mt-1">A campaign with this name already exists. Please choose a different name.</p>
                        )}
                    </div>

                    {serverError && <p className="text-sm text-red-500">{serverError}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors tracking-widest uppercase text-sm"
                    >
                        {isSubmitting ? "Creating…" : "Create Campaign"}
                    </button>
                </form>
            </div>
        </div>
    );
}

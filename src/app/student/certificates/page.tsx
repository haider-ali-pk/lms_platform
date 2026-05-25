"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/components/student/StudentSidebar";
import { Award, ArrowLeft, Download, BookOpen, User, Calendar, CheckCircle, Lock, Star } from "lucide-react";

interface Certificate {
  id: string;
  courseId: string;
  title: string;
  thumbnail: string | null;
  issuedAt: string;
  issuedBy: string;
  issuerRole: string;
  grade: string | null;
  type: "manual" | "auto";
}

function CertificateCard({ cert, onDownload }: { cert: Certificate; onDownload: (cert: Certificate) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {/* Top color bar */}
      <div className={`h-1.5 w-full ${cert.type === "manual" ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gradient-to-r from-emerald-400 to-teal-500"}`} />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cert.type === "manual" ? "bg-indigo-50" : "bg-emerald-50"}`}>
            <Award size={24} className={cert.type === "manual" ? "text-indigo-600" : "text-emerald-600"} />
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cert.type === "manual" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
            {cert.type === "manual" ? "Issued" : "Auto-earned"}
          </span>
        </div>

        {/* Course title */}
        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{cert.title}</h3>
        <p className="text-xs text-gray-400 mb-4">Certificate of Completion</p>

        {/* Meta */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={13} className="text-gray-400" />
            <span>Issued {new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User size={13} className="text-gray-400" />
            <span>By {cert.issuedBy} {cert.issuerRole !== "auto" && <span className="capitalize text-gray-400">({cert.issuerRole})</span>}</span>
          </div>
          {cert.grade && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Star size={13} className="text-amber-400" />
              <span>Grade: <span className="font-semibold text-gray-800">{cert.grade}</span></span>
            </div>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={() => onDownload(cert)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${cert.type === "manual" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
        >
          <Download size={15} /> Download Certificate
        </button>
      </div>
    </div>
  );
}

// Printable certificate component
function CertificateTemplate({ cert, studentName }: { cert: Certificate; studentName: string }) {
  return (
    <div
      id="cert-print"
      style={{
        width: "900px", height: "636px", background: "white",
        border: "12px solid #4F46E5", borderRadius: "16px",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "48px", position: "relative",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Corner decorations */}
      {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map((pos, i) => (
        <div key={i} style={{ position: "absolute", top: pos.includes("top") ? 12 : undefined, bottom: pos.includes("bottom") ? 12 : undefined, left: pos.includes("left") ? 12 : undefined, right: pos.includes("right") ? 12 : undefined, width: 32, height: 32, border: "3px solid #c7d2fe", borderRadius: 4 }} />
      ))}

      {/* Badge */}
      <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#4F46E5,#7c3aed)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 32 }}>🏆</span>
      </div>

      <p style={{ fontSize: 13, color: "#6b7280", letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>Certificate of Completion</p>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>This is to certify that</p>

      <h1 style={{ fontSize: 36, fontWeight: "bold", color: "#111827", marginBottom: 8, textAlign: "center" }}>{studentName}</h1>
      <div style={{ width: 200, height: 2, background: "#4F46E5", marginBottom: 20, borderRadius: 2 }} />

      <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 8 }}>has successfully completed the course</p>
      <h2 style={{ fontSize: 24, fontWeight: "bold", color: "#4F46E5", textAlign: "center", marginBottom: 24 }}>{cert.title}</h2>

      {cert.grade && (
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>with grade <strong style={{ color: "#111827" }}>{cert.grade}</strong></p>
      )}

      <div style={{ display: "flex", gap: 48, marginTop: 8 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: "bold", color: "#111827" }}>{new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <div style={{ width: 120, height: 1, background: "#d1d5db", margin: "4px auto" }} />
          <p style={{ fontSize: 11, color: "#9ca3af" }}>Date Issued</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: "bold", color: "#111827" }}>{cert.issuedBy}</p>
          <div style={{ width: 120, height: 1, background: "#d1d5db", margin: "4px auto" }} />
          <p style={{ fontSize: 11, color: "#9ca3af" }}>Issued By</p>
        </div>
      </div>

      <p style={{ position: "absolute", bottom: 16, fontSize: 10, color: "#d1d5db" }}>EduFlow LMS • Certificate ID: {cert.id}</p>
    </div>
  );
}

export default function CertificatesPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("Student");
  const [printing, setPrinting] = useState<Certificate | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/student/certificates")
      .then((r) => r.json())
      .then((d) => { setCerts(d.certificates ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load certificates"); setLoading(false); });

    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((d) => { if (d.first_name) setStudentName(`${d.first_name} ${d.last_name}`); })
      .catch(() => {});
  }, []);

  const handleDownload = (cert: Certificate) => {
    setPrinting(cert);
    setTimeout(() => {
      const el = document.getElementById("cert-print");
      if (!el) return;
      const originalBody = document.body.innerHTML;
      document.body.innerHTML = el.outerHTML;
      window.print();
      document.body.innerHTML = originalBody;
      window.location.reload();
    }, 300);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar active="certificates" />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Certificates</h1>
            <p className="text-sm text-gray-500">Your earned achievements and completions</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold">
            <Award size={16} /> {certs.length} Certificate{certs.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
              ))}
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 rounded-2xl p-5 text-sm">{error}</div>}

          {!loading && !error && certs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Lock size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-bold text-gray-700">No Certificates Yet</p>
              <p className="text-sm text-gray-400 text-center max-w-sm">Complete all lessons in a course and pass the quizzes to earn your certificate, or wait for your teacher to issue one.</p>
              <button onClick={() => router.push("/student/courses")} className="mt-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <BookOpen size={15} /> Browse My Courses
              </button>
            </div>
          )}

          {!loading && certs.length > 0 && (
            <>
              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Award size={20} className="text-indigo-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{certs.length}</p>
                    <p className="text-xs text-gray-500">Total Earned</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle size={20} className="text-emerald-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{certs.filter((c) => c.type === "auto").length}</p>
                    <p className="text-xs text-gray-500">Auto-earned</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Star size={20} className="text-purple-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{certs.filter((c) => c.type === "manual").length}</p>
                    <p className="text-xs text-gray-500">Issued by Teacher</p>
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {certs.map((cert) => (
                  <CertificateCard key={cert.id} cert={cert} onDownload={handleDownload} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Hidden print template */}
      {printing && (
        <div style={{ position: "fixed", top: -9999, left: -9999 }}>
          <CertificateTemplate cert={printing} studentName={studentName} />
        </div>
      )}
    </div>
  );
}
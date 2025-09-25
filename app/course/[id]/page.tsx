"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface Course {
  id: number;
  created_at: string;
  title: string;
  description: string;
  pdf_url: string | null;
}

interface Module {
  id: number;
  title: string;
  description: string;
  course_id: number;
  pdf_url: string | null;
  pdfs?: Array<{ name: string; url: string }>;
}

export default function CoursePage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const params = useParams();
  const router = useRouter();
  const courseId = params.id;

  useEffect(() => {
    const fetchCourseAndPdfs = async () => {
      if (!courseId) return;

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setError("Supabase not configured");
        setLoading(false);
        return;
      }

      try {
        // Fetch specific course from the Supabase table
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (error) {
          console.error("Error fetching course:", error.message);
          setError("Error fetching course");
          setLoading(false);
          return;
        }

        if (data) {
          setCourse(data);

          // Fetch modules for this course
          const { data: modulesList, error: modulesError } = await supabase
            .from("modules")
            .select("*")
            .eq("course_id", courseId);

          console.log(
            "Modules from database:",
            modulesList,
            "Error:",
            modulesError
          );

          if (!modulesError && modulesList) {
            // Determine bucket and folder naming based on course
            console.log(
              "Course ID for bucket selection:",
              courseId,
              typeof courseId
            );

            // Helper function to get PDFs for a specific module
            const getModulePdfs = async (
              courseId: number,
              moduleIndex: number
            ) => {
              const path = `course-${courseId}/module-${moduleIndex + 1}`;
              console.log(`Fetching PDFs from: pdfs/${path}`);

              const { data, error } = await supabase.storage
                .from("pdfs")
                .list(path);

              if (error) {
                console.error(`Error fetching PDFs from ${path}:`, error);
                return [];
              }

              if (!data) {
                console.log(`No data returned for ${path}`);
                return [];
              }

              const pdfFiles = data
                .filter(
                  (file) =>
                    file.name && file.name.toLowerCase().endsWith(".pdf")
                )
                .map((file) => ({
                  name: file.name,
                  url: supabase.storage
                    .from("pdfs")
                    .getPublicUrl(`${path}/${file.name}`).data.publicUrl,
                }));

              console.log(
                `Found ${pdfFiles.length} PDFs in ${path}:`,
                pdfFiles.map((f) => f.name)
              );
              return pdfFiles;
            };

            // Fetch PDFs for each module from storage
            const modulesWithPdfs = await Promise.all(
              (modulesList as Module[]).map(
                async (module: Module, index: number) => {
                  try {
                    const pdfFiles = await getModulePdfs(
                      (data as Course).id,
                      index
                    );
                    return { ...module, pdfs: pdfFiles } as Module;
                  } catch (error) {
                    console.error(
                      `Error fetching PDFs for module ${index + 1} of course ${
                        (data as Course).id
                      }:`,
                      error
                    );
                    return { ...module, pdfs: [] } as Module;
                  }
                }
              )
            );
            console.log("Final modules with PDFs:", modulesWithPdfs);
            setModules(modulesWithPdfs);
          } else if (modulesError) {
            console.error("Error fetching modules:", modulesError.message);
          }
        } else {
          setError("Курсът не е намерен");
        }
      } catch (error) {
        console.error("Error connecting to Supabase:", error);
        setError("Грешка при свързване с базата данни");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndPdfs();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Грешка</h1>
            <p className="text-gray-600 mb-6">
              {error || "Курсът не е намерен"}
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
            >
              Назад към курсовете
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      {/* Logo in top left */}
      {/* Header */}
      <div className="relative">
        {/* Back button in far left */}
        <button
          onClick={() => router.push("/")}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center text-green-600 hover:text-green-800 font-medium transition-colors duration-200 z-10"
        >
          <svg
            className="w-5 h-5 max-[1000px]:mr-0 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="max-[1000px]:hidden">Назад</span>
        </button>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Centered logo */}
          <div className="flex justify-center">
            <Image
              src="/mk-study.png"
              alt="Logo"
              width={150}
              height={80}
              className="object-contain cursor-pointer"
              priority
              onClick={() => router.push("/")}
            />
          </div>
        </div>
      </div>
      {/* Course Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Course Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 px-8 py-12 text-white">
            <h3 className="text-3xl font-bold mb-4">{course.title}</h3>
          </div>

          {/* Course Details */}
          <div className="p-8">
            {/* Course Information */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Информация за курса
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Дата на създаване
                  </h3>
                  <p className="text-gray-600">
                    {formatDate(course.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modules Section */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Модули на курса
              </h2>
              {modules.length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 text-green-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-medium text-green-900 mb-1">
                        Модули налице ({modules.length})
                      </h3>
                      <p className="text-green-700 text-sm">
                        Кликнете за да видите всички модули на курса
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setIsDialogOpen(true)}
                      className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Прегледай модулите ({modules.length})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 text-yellow-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-medium text-yellow-900 mb-1">
                        Няма налични модули
                      </h3>
                      <p className="text-yellow-700 text-sm">
                        Модулите за този курс ще бъдат добавени скоро
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modules Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Модули на курса: {course?.title}
              </h3>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() =>
                        setOpenAccordion(
                          openAccordion === module.id ? null : module.id
                        )
                      }
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-blue-600 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        <div className="text-left">
                          <span className="text-medium text-gray-900 block">
                            Модул {index + 1}
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          openAccordion === module.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Accordion Content */}
                    {openAccordion === module.id && (
                      <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="space-y-4">
                          {/* PDF Files List */}
                          <div className="pt-3 border-t border-gray-100">
                            <h5 className="font-medium text-gray-900 mb-3">
                              PDF материали ({module.pdfs?.length || 0})
                            </h5>
                            {module.pdfs && module.pdfs.length > 0 ? (
                              <div className="space-y-2">
                                {module.pdfs.map((pdf, pdfIndex) => (
                                  <div
                                    key={pdf.name}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex items-center flex-1">
                                      <svg
                                        className="w-5 h-5 text-red-600 mr-3 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {pdf.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          PDF документ #{pdfIndex + 1}
                                        </p>
                                      </div>
                                    </div>
                                    <a
                                      href={pdf.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-3 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 flex-shrink-0"
                                    >
                                      <svg
                                        className="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                      Отвори
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <svg
                                  className="w-8 h-8 text-gray-400 mx-auto mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <p className="text-sm text-gray-500">
                                  Няма налични PDF материали за този модул
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

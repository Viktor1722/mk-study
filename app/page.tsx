"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface Course {
  id: number;
  created_at: string;
  title: string;
  description: string;
  pdf_url: string | null;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured");
        return;
      }

      try {
        // Fetch courses from the Supabase table
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching courses:", error.message);
          return;
        }

        // Use real data from Supabase table
        if (data && data.length > 0) {
          setCourses(data);
        } else {
          console.log("No courses found in table");
        }
      } catch (error) {
        console.error("Error connecting to Supabase:", error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        {/* Centered Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/mk-study.png"
            alt="Logo"
            width={180}
            height={120}
            className="object-contain"
            priority
          />
        </div>

        {/* Centered Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Курсове</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Компонент 2: Обучение за DI-GI умения и компетенции. Обученията се
            предлагат за работещи и безработни лица.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto"></p>
          <br />
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {" "}
            Цифрова компетентност
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Форми на обучение: Присъствена, Дистанционно, Смесено. Синхронна и
            не синхронна дистанционна форма на обучение
          </p>
        </div>

        {/* Course Cards Grid */}
        <div className="flex justify-center">
          <div className="max-w-4xl w-full">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Няма налични курсове в момента
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => router.push(`/course/${course.id}`)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 w-80"
                  >
                    <div className="p-10 text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {course.title}
                      </h3>
                      <div className="w-12 h-1 bg-green-600 mx-auto rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Braingym Login Button */}
            <div className="flex justify-center mt-8">
              <a
                href="https://braingym.digital/login/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg"
              >
                Запиши се за обучение
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

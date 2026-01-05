"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    id: 1,
    question: "What is Blumpo?",
    answer: "Blumpo is an AI-powered ad generator specialized in B2B ads that creates high-performing advertisements by analyzing your product, website data, and customer insights from Reddit and social media. It studies successful ad campaigns and automatically generates creative content tailored to your specific audience and marketing goals.",
  },
  {
    id: 2,
    question: "How much does it cost?",
    answer: "We offer flexible pricing plans to suit businesses of all sizes. You can start with our free tier to create your first ad, then upgrade to premium plans starting at $17/month for advanced features and additional ads credits.",
  },
  {
    id: 3,
    question: "Can I try it for free?",
    answer: "Yes, you can start with our free tier to create your first ad without any credit card required.",
  },
  {
    id: 4,
    question: "What types of ads can I create?",
    answer: "Currently, we offer creation of static ads and social posts, with video ads coming soon. We deeply understand what makes B2B ads perform well and offer multiple proven archetypes to ensure diversity, including problem-solution formats, testimonial, memes, product showcases, and competitor comparisons.",
  },
  {
    id: 5,
    question: "Do I need design or marketing experience?",
    answer: "Zero design experience necessary! Blumpo's AI does the heavy lifting, automatically creating diverse high-performing ads based on your product details and authentic customer insights from Reddit and social media.",
  },
  {
    id: 6,
    question: "Can I make ads in multiple languages?",
    answer: "Yes, you can make ads in more than +100 languages. You can select language of your ads in the brand settings!",
  },
  {
    id: 7,
    question: "How is Blumpo different from other AI ad generators and general AI tools like ChatGPT?",
    answer: "Our team of ex-founders from marketing-driven businesses has spent thousands of hours analyzing top-performing ads and fine-tuning our AI models so you don't have to. General tools are fine if you want to create a few images, but Blumpo offers much deeper customer research and generates diverse ads using proven high-performing archetypes—all while being incredibly easy to use. We're also the only platform specifically optimized for B2B advertising.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item is open by default

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mt-12 w-full">
      <div className="bg-white border-2 border-[#d8d8db] rounded-[20px] shadow-[0px_0px_7px_3px_rgba(0,0,0,0.15)] p-[30px] w-full max-w-[718px] mx-auto">
        <div className="flex flex-col gap-[18px]">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col transition-all duration-300 ease-in-out"
                )}
              >
                <div
                  className={cn(
                    "rounded-[19px] transition-all duration-300 ease-in-out",
                    isOpen ? "p-[2px] gradient-primary" : "p-[1px] gradient-primary"
                  )}
                >
                <button
                  onClick={() => toggleItem(index)}
                  className={cn(
                    "bg-[#f9fafb] rounded-[17px]  px-[26px] py-[13px] w-full cursor-pointer",
                    "flex items-center justify-between",
                    "transition-all duration-300 ease-in-out"
                  )}
                >
                  <p className="font-bold text-[16px] sm:text-[20px] text-[#0a0a0a] text-left mr-4 flex-1 min-w-0 leading-snug">
                    {item.question}
                  </p>
                  <div
                    className={cn(
                      "w-[26px] h-[26px] bg-[#0a0a0a] rounded-full",
                      "flex items-center justify-center flex-shrink-0",
                      "transition-transform duration-300 ease-in-out",
                      isOpen && "rotate-180"
                    )}
                  >
                    <ChevronDown className="w-[20px] h-[20px] text-white" />
                    </div>
                  </button>
                </div>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[200px] opacity-100 mt-[22px]" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-[26px] py-0">
                    <p className="font-medium text-[15px] text-[#888e98] leading-normal">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

